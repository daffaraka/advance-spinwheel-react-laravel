<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('spin_queues', function (Blueprint $table) {
            $table->id();
            $table->string('platform'); // tiktok or shopee
            $table->foreignId('prize_id')->constrained('prizes')->onDelete('cascade');
            $table->integer('sort_order')->default(0);
            $table->enum('status', ['pending', 'completed'])->default('pending');
            $table->string('receipt_number')->nullable(); // filled after spin
            $table->foreignId('spin_history_id')->nullable()->constrained('spin_histories')->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('spin_queues');
    }
};
