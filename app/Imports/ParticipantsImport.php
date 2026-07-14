<?php

namespace App\Imports;

use App\Models\Participant;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithChunkReading;

class ParticipantsImport implements ToCollection, WithChunkReading
{
    private $platform;

    public function __construct($platform)
    {
        $this->platform = strtolower($platform);
    }

    public function collection(Collection $rows)
    {
        $data = [];
        foreach ($rows as $index => $row) {
            // Skip heading row if it looks like one
            if ($index == 0 && (!empty($row[0]) && (strtolower($row[0]) == 'resi' || strtolower($row[0]) == 'receipt_number'))) {
                continue;
            }
            
            if (!empty($row[0])) {
                $data[] = [
                    'receipt_number' => (string) $row[0],
                    'platform' => $this->platform,
                    'is_winner' => false,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }
        
        // Insert chunks of data
        foreach (array_chunk($data, 500) as $chunk) {
            Participant::insertOrIgnore($chunk);
        }
    }

    public function chunkSize(): int
    {
        return 2000;
    }
}
