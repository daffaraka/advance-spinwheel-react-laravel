<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Participant;
use App\Models\Prize;
use App\Models\RiggedWinner;
use App\Models\ContentSpinSequence;
use Illuminate\Support\Str;
use Inertia\Inertia;
use App\Models\SpinHistory;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\DB;
use App\Imports\ParticipantsImport;
use App\Imports\ParticipantsCombinedImport;

class ApiController extends Controller
{
    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,csv,xls',
            'platform' => 'required|string|in:tiktok,shopee,mix',
        ]);

        $platform = strtolower($request->platform);

        // Truncate old data for this platform
        Participant::whereIn('platform', $platform === 'mix' ? ['tiktok', 'shopee'] : [$platform])->delete();

        // Import new data
        Excel::import(new ParticipantsImport($platform), $request->file('file'));

        $count = Participant::whereIn('platform', $platform === 'mix' ? ['tiktok', 'shopee'] : [$platform])->count();

        return response()->json(['message' => 'Upload successful', 'total' => $count]);
    }

    public function uploadCombined(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,csv,xls',
        ]);

        // Truncate old data for both platforms
        Participant::where('platform', 'tiktok')->delete();
        Participant::where('platform', 'shopee')->delete();

        // Import with combined importer
        $import = new ParticipantsCombinedImport();
        Excel::import($import, $request->file('file'));

        $counts = $import->getCounts();
        $tiktokCount = Participant::where('platform', 'tiktok')->count();
        $shopeeCount = Participant::where('platform', 'shopee')->count();

        return response()->json([
            'message' => 'Upload successful',
            'tiktok' => $tiktokCount,
            'shopee' => $shopeeCount,
            'total' => $tiktokCount + $shopeeCount
        ]);
    }

    public function prizes()
    {
        return response()->json(Prize::all());
    }

    public function addPrize(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'stock' => 'required|integer|min:0'
        ]);

        $prize = Prize::create($request->only(['name', 'stock']));
        return response()->json($prize);
    }

    public function updatePrize(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string',
            'stock' => 'required|integer|min:0'
        ]);

        $prize = Prize::findOrFail($id);
        $prize->update($request->only(['name', 'stock']));
        return response()->json($prize);
    }

    public function deletePrize($id)
    {
        $prize = Prize::findOrFail($id);
        $prize->delete();
        return response()->json(['message' => 'Prize deleted']);
    }

    public function setWinner(Request $request)
    {
        $request->validate([
            'receipt_number' => 'required|string',
            'platform' => 'required|string',
            'prize_id' => 'required|exists:prizes,id'
        ]);

        $platform = strtolower($request->platform);
        $receipt = $request->receipt_number;

        $participant = Participant::whereIn('platform', $platform === 'mix' ? ['tiktok', 'shopee'] : [$platform])
            ->where('receipt_number', $receipt)
            ->first();

        if (!$participant) {
            return response()->json(['error' => 'Nomor resi tidak terdaftar di database peserta.'], 400);
        }
        if ($participant->is_winner) {
            return response()->json(['error' => 'Nomor resi ini sudah pernah menang sebelumnya.'], 400);
        }

        $rigged = RiggedWinner::create([
            'receipt_number' => $receipt,
            'platform' => $platform,
            'prize_id' => $request->prize_id,
            'is_used' => false
        ]);

        return response()->json(['message' => 'Rigged winner set', 'data' => $rigged]);
    }

    public function spin(Request $request)
    {
        $request->validate([
            'platform' => 'required|string',
            'prize_id' => 'required|exists:prizes,id',
            'title' => 'required|string'
        ]);

        $platform = strtolower($request->platform);
        $prizeId = $request->prize_id;

        $prize = Prize::find($prizeId);
        if ($prize->stock <= 0) {
            return response()->json(['error' => 'Prize out of stock'], 400);
        }

        DB::beginTransaction();
        try {
            $isRigged = false;
            $riggedParticipant = null;

            // Direct rigged winner from frontend live search
            if ($request->filled('rigged_receipt')) {
                $riggedParticipant = Participant::whereIn('platform', $platform === 'mix' ? ['tiktok', 'shopee'] : [$platform])
                    ->where('receipt_number', $request->rigged_receipt)
                    ->where('is_winner', false)
                    ->first();
                    
                if ($riggedParticipant) {
                    $winnerReceipt = $riggedParticipant->receipt_number;
                    $riggedParticipant->update(['is_winner' => true]);
                    $isRigged = true;
                }
            }

            // Fallback to table RiggedWinner if not provided from live search
            if (!$isRigged) {
                $rigged = RiggedWinner::where('platform', $platform)
                    ->where('prize_id', $prizeId)
                    ->where('is_used', false)
                    ->first();

            // Validate if rigged winner is still eligible
            if ($rigged) {
                $riggedParticipant = Participant::whereIn('platform', $platform === 'mix' ? ['tiktok', 'shopee'] : [$platform])
                    ->where('receipt_number', $rigged->receipt_number)
                    ->first();
                    
                if ($riggedParticipant && !$riggedParticipant->is_winner) {
                    $rigged->update(['is_used' => true]);
                    $winnerReceipt = $rigged->receipt_number;
                    $riggedParticipant->update(['is_winner' => true]);
                    $isRigged = true;
                } else {
                    $rigged = null; // Fallback to random
                }
            }
            }
            
            if (!$isRigged) {
                // Random draw
                $participant = Participant::whereIn('platform', $platform === 'mix' ? ['tiktok', 'shopee'] : [$platform])
                    ->where('is_winner', false)
                    ->inRandomOrder()
                    ->first();

                if (!$participant) {
                    DB::rollBack();
                    return response()->json(['error' => 'No participants left'], 400);
                }

                $participant->update(['is_winner' => true]);
                $winnerReceipt = $participant->receipt_number;
            }

            // Do not decrease prize stock per client request
            // $prize->decrement('stock');

            // Generate Wheel Items
            $decoys = Participant::whereIn('platform', $platform === 'mix' ? ['tiktok', 'shopee'] : [$platform])
                ->where('is_winner', false)
                ->where('receipt_number', '!=', $winnerReceipt)
                ->inRandomOrder()
                ->take(99)
                ->pluck('receipt_number')
                ->toArray();
                
            $decoys[] = $winnerReceipt;
            shuffle($decoys);
            $winnerIndex = array_search($winnerReceipt, $decoys);
            
            // Save to SpinHistory
            SpinHistory::create([
                'title' => $request->title,
                'platform' => $platform,
                'receipt_number' => $winnerReceipt,
                'prize_name' => $prize->name,
                'prize_id' => $prize->id,
                'is_rigged' => $isRigged,
            ]);

            DB::commit();

            return response()->json([
                'receipt_number' => $winnerReceipt,
                'prize' => $prize->name,
                'wheel_items' => $decoys,
                'winner_index' => $winnerIndex
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Spin failed', 'msg' => $e->getMessage()], 500);
        }
    }

    public function stats(Request $request)
    {
        $platform = strtolower($request->query('platform', 'tiktok'));
        $total = Participant::whereIn('platform', $platform === 'mix' ? ['tiktok', 'shopee'] : [$platform])->count();
        $winners = Participant::whereIn('platform', $platform === 'mix' ? ['tiktok', 'shopee'] : [$platform])->where('is_winner', true)->count();
        
        $preview = Participant::whereIn('platform', $platform === 'mix' ? ['tiktok', 'shopee'] : [$platform])
            ->where('is_winner', false)
            ->inRandomOrder()
            ->take(100)
            ->pluck('receipt_number')
            ->toArray();

        return response()->json([
            'total' => $total,
            'winners' => $winners,
            'preview_items' => $preview
        ]);
    }

    public function histories(Request $request)
    {
        try {
            $query = SpinHistory::with('prize');

            if ($request->has('platform')) {
                $query->where('platform', strtolower($request->platform));
            }

            if ($request->filled('month')) {
                $monthStr = $request->month;
                if (strlen($monthStr) == 2) {
                    $query->whereMonth('created_at', $monthStr);
                } else if (strlen($monthStr) == 7) {
                    $parts = explode('-', $monthStr);
                    $query->whereYear('created_at', $parts[0])
                          ->whereMonth('created_at', $parts[1]);
                }
            }

            if ($request->filled('prize')) {
                $query->where('prize_name', $request->prize);
            }

            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('receipt_number', 'like', "%{$search}%");
                });
            }

            $histories = $query->orderBy('created_at', 'desc')->paginate(10);
            return response()->json($histories);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()], 500);
        }
    }

    public function createHistory(Request $request)
    {
        $request->validate([
            'title' => 'required|string',
            'platform' => 'required|string',
            'receipt_number' => 'required|string',
            'prize_id' => 'required|exists:prizes,id',
            'is_rigged' => 'boolean'
        ]);

        DB::beginTransaction();
        try {
            $prize = Prize::findOrFail($request->prize_id);

            $participant = Participant::whereIn('platform', strtolower($request->platform) === 'mix' ? ['tiktok', 'shopee'] : [strtolower($request->platform)])
                ->where('receipt_number', $request->receipt_number)
                ->first();

            if ($participant) {
                $participant->update(['is_winner' => true]);
            }

            $history = SpinHistory::create([
                'title' => $request->title,
                'platform' => strtolower($request->platform),
                'receipt_number' => $request->receipt_number,
                'prize_id' => $prize->id,
                'prize_name' => $prize->name,
                'is_rigged' => $request->boolean('is_rigged'),
            ]);

            DB::commit();
            return response()->json($history->load('prize'));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function updateHistory(Request $request, $id)
    {
        $request->validate([
            'title' => 'required|string',
            'prize_id' => 'required|exists:prizes,id',
            'is_rigged' => 'boolean',
        ]);

        try {
            DB::beginTransaction();
            $history = SpinHistory::findOrFail($id);
            $prize = Prize::findOrFail($request->prize_id);

            $history->update([
                'title' => $request->title,
                'prize_id' => $prize->id,
                'prize_name' => $prize->name,
                'is_rigged' => $request->boolean('is_rigged'),
            ]);

            DB::commit();
            return response()->json($history->load('prize'));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function deleteHistory($id)
    {
        try {
            DB::beginTransaction();
            $history = SpinHistory::findOrFail($id);
            
            // Revert participant winner status
            Participant::where('platform', $history->platform)
                ->where('receipt_number', $history->receipt_number)
                ->update(['is_winner' => false]);
                
            $history->delete();
            
            DB::commit();
            return response()->json(['message' => 'History deleted']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function searchParticipants(Request $request)
    {
        $request->validate([
            'platform' => 'required|string',
            'q' => 'nullable|string'
        ]);

        $query = Participant::whereIn('platform', strtolower($request->platform) === 'mix' ? ['tiktok', 'shopee'] : [strtolower($request->platform)])
            ->where('is_winner', false);

        if ($request->filled('q')) {
            $query->where('receipt_number', 'like', '%' . $request->q . '%');
        }

        $participants = $query->limit(10)->get(['id', 'receipt_number']);
        
        return response()->json($participants);
    }

    public function replayPage($id)
    {
        $history = SpinHistory::findOrFail($id);
        
        $decoys = Participant::where('platform', $history->platform)
            ->where('receipt_number', '!=', $history->receipt_number)
            ->inRandomOrder()
            ->take(99)
            ->pluck('receipt_number')
            ->toArray();
            
        $decoys[] = $history->receipt_number;
        shuffle($decoys);
        $winnerIndex = array_search($history->receipt_number, $decoys);
        
        return \Inertia\Inertia::render('ReplayPage', [
            'history' => $history,
            'wheelItems' => $decoys,
            'winnerIndex' => $winnerIndex
        ]);
    }

    public function createContentSequence(Request $request)
    {
        $request->validate([
            'title' => 'required|string',
            'sequence_data' => 'required|array'
        ]);

        $uuid = Str::uuid()->toString();
        $sequence = ContentSpinSequence::create([
            'uuid' => $uuid,
            'title' => $request->title,
            'sequence_data' => $request->sequence_data,
        ]);

        return response()->json([
            'message' => 'Sesi Konten Berhasil Dibuat',
            'uuid' => $uuid,
            'url' => url('/content/session/' . $uuid)
        ]);
    }

    public function contentSpinPage($uuid)
    {
        $sequence = ContentSpinSequence::where('uuid', $uuid)->firstOrFail();
        return \Inertia\Inertia::render('ContentSpinPage', [
            'sequence_uuid' => $sequence->uuid,
            'sequence_title' => $sequence->title,
        ]);
    }

    public function getContentSequence($uuid)
    {
        $sequence = ContentSpinSequence::where('uuid', $uuid)->firstOrFail();
        return response()->json($sequence);
    }

    public function executeContentSequence(Request $request, $uuid)
    {
        $sequence = ContentSpinSequence::where('uuid', $uuid)->firstOrFail();
        
        $request->validate([
            'step_index' => 'required|integer'
        ]);
        
        $index = $request->step_index;
        $data = $sequence->sequence_data;
        
        if (!isset($data[$index])) {
            return response()->json(['error' => 'Step not found'], 404);
        }
        
        $step = $data[$index];
        $type = $step['type']; // 'existing_history', 'new_rigged', 'random'
        $platform = strtolower($request->input('platform', 'tiktok'));

        DB::beginTransaction();
        try {
            if ($type === 'existing_history') {
                $history = SpinHistory::findOrFail($step['history_id']);
                
                $decoys = Participant::where('platform', $history->platform)
                    ->where('receipt_number', '!=', $history->receipt_number)
                    ->inRandomOrder()
                    ->take(99)
                    ->pluck('receipt_number')
                    ->toArray();
                    
                $decoys[] = $history->receipt_number;
                shuffle($decoys);
                $winnerIndex = array_search($history->receipt_number, $decoys);
                
                DB::commit();
                return response()->json([
                    'receipt_number' => $history->receipt_number,
                    'prize' => $history->prize_name,
                    'wheel_items' => $decoys,
                    'winner_index' => $winnerIndex
                ]);
            } 
            elseif ($type === 'new_rigged') {
                $prize = Prize::findOrFail($step['prize_id']);
                $winnerReceipt = $step['receipt_number'];
                
                $participant = Participant::whereIn('platform', $platform === 'mix' ? ['tiktok', 'shopee'] : [$platform])
                    ->where('receipt_number', $winnerReceipt)
                    ->first();

                if ($participant) {
                    $participant->update(['is_winner' => true]);
                }
                
                $decoys = Participant::whereIn('platform', $platform === 'mix' ? ['tiktok', 'shopee'] : [$platform])
                    ->where('is_winner', false)
                    ->where('receipt_number', '!=', $winnerReceipt)
                    ->inRandomOrder()
                    ->take(99)
                    ->pluck('receipt_number')
                    ->toArray();
                    
                $decoys[] = $winnerReceipt;
                shuffle($decoys);
                $winnerIndex = array_search($winnerReceipt, $decoys);
                
                SpinHistory::create([
                    'title' => $sequence->title . ' (Step ' . ($index + 1) . ')',
                    'platform' => $platform,
                    'receipt_number' => $winnerReceipt,
                    'prize_name' => $prize->name,
                    'prize_id' => $prize->id,
                    'is_rigged' => true,
                    'content_spin_sequence_id' => $sequence->id,
                ]);
                
                DB::commit();
                return response()->json([
                    'receipt_number' => $winnerReceipt,
                    'prize' => $prize->name,
                    'wheel_items' => $decoys,
                    'winner_index' => $winnerIndex
                ]);
            }
            elseif ($type === 'random') {
                // Execute a random spin just like the normal spin
                $participant = Participant::whereIn('platform', $platform === 'mix' ? ['tiktok', 'shopee'] : [$platform])
                    ->where('is_winner', false)
                    ->inRandomOrder()
                    ->first();

                if (!$participant) {
                    throw new \Exception('Tidak ada peserta tersisa untuk diacak.');
                }
                
                $participant->update(['is_winner' => true]);
                
                $decoys = Participant::whereIn('platform', $platform === 'mix' ? ['tiktok', 'shopee'] : [$platform])
                    ->where('is_winner', false)
                    ->where('receipt_number', '!=', $participant->receipt_number)
                    ->inRandomOrder()
                    ->take(99)
                    ->pluck('receipt_number')
                    ->toArray();
                    
                $decoys[] = $participant->receipt_number;
                shuffle($decoys);
                $winnerIndex = array_search($participant->receipt_number, $decoys);
                
                SpinHistory::create([
                    'title' => $sequence->title . ' (Step ' . ($index + 1) . ')',
                    'platform' => $platform,
                    'receipt_number' => $participant->receipt_number,
                    'prize_name' => 'Ucapan Selamat',
                    'prize_id' => null,
                    'is_rigged' => false,
                    'content_spin_sequence_id' => $sequence->id,
                ]);
                
                DB::commit();
                return response()->json([
                    'receipt_number' => $participant->receipt_number,
                    'prize' => 'Ucapan Selamat',
                    'wheel_items' => $decoys,
                    'winner_index' => $winnerIndex
                ]);
            }
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Spin failed', 'msg' => $e->getMessage()], 500);
        }
    }

    public function addRandomContentSequence(Request $request, $uuid)
    {
        $sequence = ContentSpinSequence::where('uuid', $uuid)->firstOrFail();
        $platform = strtolower($request->input('platform', 'tiktok'));

        DB::beginTransaction();
        try {
            $participant = Participant::whereIn('platform', $platform === 'mix' ? ['tiktok', 'shopee'] : [$platform])
                ->where('is_winner', false)
                ->inRandomOrder()
                ->first();

            if (!$participant) {
                throw new \Exception('Tidak ada peserta tersisa untuk diacak.');
            }
            
            $participant->update(['is_winner' => true]);
            
            $decoys = Participant::whereIn('platform', $platform === 'mix' ? ['tiktok', 'shopee'] : [$platform])
                ->where('is_winner', false)
                ->where('receipt_number', '!=', $participant->receipt_number)
                ->inRandomOrder()
                ->take(99)
                ->pluck('receipt_number')
                ->toArray();
                
            $decoys[] = $participant->receipt_number;
            shuffle($decoys);
            $winnerIndex = array_search($participant->receipt_number, $decoys);
            
            $newStepIndex = count($sequence->sequence_data);

            SpinHistory::create([
                'title' => $sequence->title . ' (Step ' . ($newStepIndex + 1) . ')',
                'platform' => $platform,
                'receipt_number' => $participant->receipt_number,
                'prize_name' => 'Ucapan Selamat',
                'prize_id' => null,
                'is_rigged' => false,
                'content_spin_sequence_id' => $sequence->id,
            ]);
            
            // Append to sequence_data
            $currentData = $sequence->sequence_data;
            $currentData[] = ['id' => time(), 'type' => 'random'];
            $sequence->sequence_data = $currentData;
            $sequence->save();

            DB::commit();
            return response()->json([
                'receipt_number' => $participant->receipt_number,
                'prize' => 'Ucapan Selamat',
                'wheel_items' => $decoys,
                'winner_index' => $winnerIndex,
                'sequence_data' => $sequence->sequence_data
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Spin failed', 'msg' => $e->getMessage()], 500);
        }
    }

    // ==========================================
    // EVENT FEATURE (Master-Detail)
    // ==========================================

    public function getEvents(Request $request)
    {
        $platform = $request->input('platform', 'tiktok');
        $events = \App\Models\Event::where('platform', $platform)
            ->withCount(['details as pending_count' => function ($query) {
                $query->where('status', 'pending');
            }])
            ->orderBy('id', 'desc')
            ->get();

        return response()->json($events);
    }

    public function createEvent(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'platform' => 'required|in:tiktok,shopee,mix',
        ]);

        $slug = \Illuminate\Support\Str::slug($request->name . '-' . uniqid());

        $event = \App\Models\Event::create([
            'name' => $request->name,
            'slug' => $slug,
            'platform' => $request->platform,
            'status' => 'active',
        ]);

        return response()->json($event, 201);
    }

    public function deleteEvent($id)
    {
        $event = \App\Models\Event::findOrFail($id);
        $event->delete();
        return response()->json(['message' => 'Event dihapus']);
    }

    public function getEventDetails($eventId)
    {
        $details = \App\Models\EventDetail::where('event_id', $eventId)
            ->with(['prize', 'participant'])
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json($details);
    }

    public function bulkCreateEventDetails(Request $request, $eventId)
    {
        $event = \App\Models\Event::findOrFail($eventId);
        
        $request->validate([
            'count' => 'required|integer|min:1|max:50',
        ]);

        $maxSort = \App\Models\EventDetail::where('event_id', $event->id)
            ->max('sort_order') ?? 0;

        for ($i = 0; $i < $request->count; $i++) {
            \App\Models\EventDetail::create([
                'event_id' => $event->id,
                'prize_id' => null,
                'participant_id' => null,
                'sort_order' => $maxSort + $i + 1,
                'status' => 'pending',
            ]);
        }

        return $this->getEventDetails($eventId);
    }

    public function updateEventDetail(Request $request, $id)
    {
        $detail = \App\Models\EventDetail::findOrFail($id);

        $request->validate([
            'prize_id' => 'nullable|exists:prizes,id',
            'participant_id' => 'nullable|exists:participants,id',
        ]);

        $data = [];
        if ($request->has('prize_id')) {
            $data['prize_id'] = $request->prize_id ?: null;
        }
        if ($request->has('participant_id')) {
            $data['participant_id'] = $request->participant_id ?: null;
        }

        $detail->update($data);
        $detail->load(['prize', 'participant']);

        return response()->json($detail);
    }

    public function deleteEventDetail($id)
    {
        $detail = \App\Models\EventDetail::findOrFail($id);
        $detail->delete();
        return response()->json(['message' => 'Slot dihapus']);
    }

    public function liveSpinPage($platform, $slug)
    {
        if (!in_array($platform, ['tiktok', 'shopee', 'mix'])) {
            abort(404);
        }

        $event = \App\Models\Event::where('slug', $slug)
            ->where('platform', $platform)
            ->firstOrFail();

        return Inertia::render('LiveSpinPage', [
            'platform' => $platform,
            'event' => $event,
        ]);
    }

    public function getLiveEventDetails($platform, $slug)
    {
        $event = \App\Models\Event::where('slug', $slug)
            ->where('platform', $platform)
            ->firstOrFail();

        $details = \App\Models\EventDetail::where('event_id', $event->id)
            ->where('status', 'pending')
            ->with(['prize', 'participant'])
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        $fixedReceipts = [];
        foreach ($details as $d) {
            if ($d->participant) {
                $fixedReceipts[] = $d->participant->receipt_number;
            }
        }
        $fixedReceipts = array_unique($fixedReceipts);
        
        $needed = 100 - count($fixedReceipts);
        $randomReceipts = [];
        if ($needed > 0) {
            $randomReceipts = \App\Models\Participant::whereIn('platform', $platform === 'mix' ? ['tiktok', 'shopee'] : [$platform])
                ->where('is_winner', false)
                ->whereNotIn('receipt_number', $fixedReceipts)
                ->inRandomOrder()
                ->take($needed)
                ->pluck('receipt_number')
                ->toArray();
        }

        $initialWheel = array_merge($fixedReceipts, $randomReceipts);
        shuffle($initialWheel);

        $completedDetails = \App\Models\EventDetail::where('event_id', $event->id)
            ->where('status', 'completed')
            ->with(['prize', 'participant'])
            ->orderBy('updated_at', 'asc')
            ->get();
            
        $history = $completedDetails->map(function ($d, $index) {
            return [
                'step' => $index + 1,
                'receipt' => $d->participant ? $d->participant->receipt_number : '-',
                'prize' => $d->prize ? $d->prize->name : '-'
            ];
        })->toArray();

        return response()->json([
            'events' => $details,
            'initial_wheel' => $initialWheel,
            'history' => $history
        ]);
    }

    public function executeLiveEvent(Request $request, $platform, $slug)
    {
        if (!in_array($platform, ['tiktok', 'shopee', 'mix'])) {
            return response()->json(['error' => 'Platform tidak valid'], 400);
        }

        DB::beginTransaction();
        try {
            $event = \App\Models\Event::where('slug', $slug)
                ->where('platform', $platform)
                ->firstOrFail();

            $query = \App\Models\EventDetail::where('event_id', $event->id)
                ->where('status', 'pending')
                ->with(['prize', 'participant']);

            if ($request->has('detail_id')) {
                $query->where('id', $request->detail_id);
            } else {
                $query->orderBy('sort_order')->orderBy('id');
            }

            $detail = $query->lockForUpdate()->first();

            if (!$detail) {
                throw new \Exception('Tidak ada antrean slot tersisa untuk event ini.');
            }

            // Determine prize
            $prize = $detail->prize;
            if (!$prize) {
                $request->validate(['prize_id' => 'required|exists:prizes,id']);
                $prize = Prize::findOrFail($request->prize_id);
                $detail->update(['prize_id' => $prize->id]);
            }

            // Determine participant
            $isRigged = false;
            if ($detail->participant_id) {
                $participant = $detail->participant;
                $isRigged = true;
            } else {
                $participant = Participant::whereIn('platform', $platform === 'mix' ? ['tiktok', 'shopee'] : [$platform])
                    ->where('is_winner', false)
                    ->inRandomOrder()
                    ->first();

                if (!$participant) {
                    throw new \Exception('Tidak ada peserta tersisa untuk diacak.');
                }
            }

            $participant->update(['is_winner' => true]);

            if ($prize->stock > 0) {
                $prize->decrement('stock');
            }

            $decoys = Participant::whereIn('platform', $platform === 'mix' ? ['tiktok', 'shopee'] : [$platform])
                ->where('is_winner', false)
                ->where('receipt_number', '!=', $participant->receipt_number)
                ->inRandomOrder()
                ->take(99)
                ->pluck('receipt_number')
                ->toArray();

            $decoys[] = $participant->receipt_number;
            shuffle($decoys);
            $winnerIndex = array_search($participant->receipt_number, $decoys);

            $history = SpinHistory::create([
                'title' => $event->name . ' - ' . ucfirst($platform),
                'platform' => $platform,
                'receipt_number' => $participant->receipt_number,
                'prize_name' => $prize->name,
                'prize_id' => $prize->id,
                'is_rigged' => $isRigged,
            ]);

            $detail->update([
                'status' => 'completed',
                'participant_id' => $participant->id,
                'spin_history_id' => $history->id,
            ]);

            $remaining = \App\Models\EventDetail::where('event_id', $event->id)
                ->where('status', 'pending')
                ->count();

            DB::commit();

            return response()->json([
                'receipt_number' => $participant->receipt_number,
                'prize' => $prize->name,
                'wheel_items' => $decoys,
                'winner_index' => $winnerIndex,
                'remaining' => $remaining,
                'is_rigged' => $isRigged,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Spin gagal', 'msg' => $e->getMessage()], 500);
        }
    }

    public function quickSpin(Request $request)
    {
        $request->validate([
            'platform' => 'required|string|in:tiktok,shopee,mix',
            'prize_id' => 'required|exists:prizes,id',
        ]);

        $platform = strtolower($request->platform);
        $prize = Prize::findOrFail($request->prize_id);

        DB::beginTransaction();
        try {
            // Find or create today's Quick Spin event
            $eventName = 'Quick Spin ' . now()->format('Y-m-d H:i');
            
            if ($request->filled('event_id')) {
                $event = \App\Models\Event::findOrFail($request->event_id);
            } else {
                $event = \App\Models\Event::create([
                    'name' => $eventName,
                    'slug' => 'quick-spin-' . Str::random(10),
                    'platform' => $platform,
                    'status' => 'active',
                ]);
            }

            // Pick random participant
            $participant = Participant::whereIn('platform', $platform === 'mix' ? ['tiktok', 'shopee'] : [$platform])
                ->where('is_winner', false)
                ->inRandomOrder()
                ->first();

            if (!$participant) {
                throw new \Exception('Tidak ada peserta tersisa untuk diacak.');
            }

            $participant->update(['is_winner' => true]);

            // Create event detail record
            $detail = \App\Models\EventDetail::create([
                'event_id' => $event->id,
                'prize_id' => $prize->id,
                'participant_id' => $participant->id,
                'status' => 'completed',
            ]);

            // Generate wheel items
            $decoys = Participant::whereIn('platform', $platform === 'mix' ? ['tiktok', 'shopee'] : [$platform])
                ->where('is_winner', false)
                ->where('receipt_number', '!=', $participant->receipt_number)
                ->inRandomOrder()
                ->take(99)
                ->pluck('receipt_number')
                ->toArray();

            $decoys[] = $participant->receipt_number;
            shuffle($decoys);
            $winnerIndex = array_search($participant->receipt_number, $decoys);

            // Save to SpinHistory
            $history = SpinHistory::create([
                'title' => $event->name . ' - ' . ucfirst($platform),
                'platform' => $platform,
                'receipt_number' => $participant->receipt_number,
                'prize_name' => $prize->name,
                'prize_id' => $prize->id,
                'is_rigged' => false,
            ]);

            $detail->update(['spin_history_id' => $history->id]);

            $totalParticipants = Participant::whereIn('platform', $platform === 'mix' ? ['tiktok', 'shopee'] : [$platform])->where('is_winner', false)->count();

            DB::commit();

            return response()->json([
                'receipt_number' => $participant->receipt_number,
                'prize' => $prize->name,
                'wheel_items' => $decoys,
                'winner_index' => $winnerIndex,
                'event_id' => $event->id,
                'history_id' => $history->id,
                'remaining_participants' => $totalParticipants,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Spin gagal', 'msg' => $e->getMessage()], 500);
        }
    }

    public function quickSpinInit(Request $request)
    {
        $platform = strtolower($request->query('platform', 'tiktok'));
        
        $total = Participant::whereIn('platform', $platform === 'mix' ? ['tiktok', 'shopee'] : [$platform])->count();
        $available = Participant::whereIn('platform', $platform === 'mix' ? ['tiktok', 'shopee'] : [$platform])->where('is_winner', false)->count();
        
        $preview = Participant::whereIn('platform', $platform === 'mix' ? ['tiktok', 'shopee'] : [$platform])
            ->where('is_winner', false)
            ->inRandomOrder()
            ->take(100)
            ->pluck('receipt_number')
            ->toArray();

        return response()->json([
            'total' => $total,
            'available' => $available,
            'preview_items' => $preview,
        ]);
    }
}
