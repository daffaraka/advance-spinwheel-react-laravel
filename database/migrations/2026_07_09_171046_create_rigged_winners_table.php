<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('rigged_winners', function (Blueprint $table) {
            $table->id();
            $table->string('receipt_number');
            $table->string('platform');
            $table->unsignedBigInteger('prize_id');
            $table->boolean('is_used')->default(false);
            $table->timestamps();
            
            $table->foreign('prize_id')->references('id')->on('prizes')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rigged_winners');
    }
};
