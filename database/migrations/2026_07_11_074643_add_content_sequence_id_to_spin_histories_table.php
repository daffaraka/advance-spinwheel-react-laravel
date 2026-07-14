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
        Schema::table('spin_histories', function (Blueprint $table) {
            $table->foreignId('content_spin_sequence_id')->nullable()->constrained('content_spin_sequences')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('spin_histories', function (Blueprint $table) {
            $table->dropForeign(['content_spin_sequence_id']);
            $table->dropColumn('content_spin_sequence_id');
        });
    }
};
