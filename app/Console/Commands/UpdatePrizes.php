<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('app:update-prizes')]
#[Description('Command description')]
class UpdatePrizes extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        $prizesData = [
            ['name' => 'iPhone 15', 'stock' => 10],
            ['name' => 'Mac Book', 'stock' => 5],
            ['name' => 'iPad', 'stock' => 10],
            ['name' => 'Uang Tunai 1 Juta', 'stock' => 20]
        ];

        $existingPrizes = \App\Models\Prize::orderBy('id')->get();
        
        foreach ($prizesData as $index => $data) {
            if (isset($existingPrizes[$index])) {
                $existingPrizes[$index]->update($data);
            } else {
                \App\Models\Prize::create($data);
            }
        }
        
        // Remove extra prizes if any
        if ($existingPrizes->count() > count($prizesData)) {
            for ($i = count($prizesData); $i < $existingPrizes->count(); $i++) {
                // Ignore deletion if foreign key exists or use a try block
                try {
                    $existingPrizes[$i]->delete();
                } catch (\Exception $e) {
                    $this->warn("Cannot delete prize {$existingPrizes[$i]->name} due to constraint");
                }
            }
        }

        $this->info('Prizes have been updated successfully.');
    }
}
