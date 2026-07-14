<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SpinHistory extends Model
{
    protected $fillable = [
        'title',
        'platform',
        'receipt_number',
        'prize_name',
        'prize_id',
        'is_rigged',
        'content_spin_sequence_id',
    ];

    public function prize()
    {
        return $this->belongsTo(Prize::class);
    }

    public function contentSpinSequence()
    {
        return $this->belongsTo(ContentSpinSequence::class, 'content_spin_sequence_id');
    }
}
