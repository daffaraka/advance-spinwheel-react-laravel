<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContentSpinSequence extends Model
{
    use HasFactory;

    protected $fillable = ['uuid', 'title', 'sequence_data'];

    protected $casts = [
        'sequence_data' => 'array',
    ];
}
