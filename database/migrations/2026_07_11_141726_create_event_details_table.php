<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->onDelete('cascade');
            $table->foreignId('prize_id')->nullable()->constrained('prizes')->onDelete('set null');
            $table->foreignId('participant_id')->nullable()->constrained('participants')->onDelete('set null');
            $table->integer('sort_order')->default(0);
            $table->enum('status', ['pending', 'completed'])->default('pending');
            $table->foreignId('spin_history_id')->nullable()->constrained('spin_histories')->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_details');
    }
};
