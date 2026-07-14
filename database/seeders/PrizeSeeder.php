<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PrizeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $prizes = [
            'iPhone 15 Pro Max',
            'Samsung Galaxy S24 Ultra',
            'MacBook Air M2',
            'iPad Pro 11-inch',
            'Sony PlayStation 5',
            'Nintendo Switch OLED',
            'AirPods Pro 2',
            'Logitech G Pro X Superlight',
            'Voucher Belanja 1 Juta',
            'Saldo E-Wallet 500 Ribu',
        ];

        foreach ($prizes as $prizeName) {
            \App\Models\Prize::firstOrCreate(
                ['name' => $prizeName],
                ['stock' => 1000] // Stok sangat banyak (1000) agar bisa digunakan terus (reusable)
            );
        }
    }
}
