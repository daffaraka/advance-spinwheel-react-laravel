<?php

namespace App\Imports;

use App\Models\Participant;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithChunkReading;

class ParticipantsCombinedImport implements ToCollection, WithChunkReading
{
    private $importedCounts = ['tiktok' => 0, 'shopee' => 0];

    public function collection(Collection $rows)
    {
        $data = [];
        foreach ($rows as $index => $row) {
            // Skip heading row
            if ($index == 0 && (!empty($row[0]) && (strtolower($row[0]) == 'resi' || strtolower($row[0]) == 'receipt_number'))) {
                continue;
            }

            $receiptNumber = trim((string) ($row[0] ?? ''));
            $platform = strtolower(trim((string) ($row[1] ?? '')));

            // Normalize platform name
            if (str_contains($platform, 'tiktok') || str_contains($platform, 'tik tok')) {
                $platform = 'tiktok';
            } elseif (str_contains($platform, 'shopee')) {
                $platform = 'shopee';
            } else {
                continue; // Skip rows with unrecognized platform
            }

            if (!empty($receiptNumber)) {
                $data[] = [
                    'receipt_number' => $receiptNumber,
                    'platform' => $platform,
                    'is_winner' => false,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
                $this->importedCounts[$platform]++;
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

    public function getCounts(): array
    {
        return $this->importedCounts;
    }
}
