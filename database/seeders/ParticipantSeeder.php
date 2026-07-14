<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ParticipantSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        for ($i = 1; $i <= 50; $i++) {
            \App\Models\Participant::create([
                'receipt_number' => 'TK-' . strtoupper(\Illuminate\Support\Str::random(8)),
                'platform' => 'tiktok',
                'is_winner' => false,
            ]);
        }
        for ($i = 1; $i <= 50; $i++) {
            \App\Models\Participant::create([
                'receipt_number' => 'SP-' . strtoupper(\Illuminate\Support\Str::random(8)),
                'platform' => 'shopee',
                'is_winner' => false,
            ]);
        }
    }
}
