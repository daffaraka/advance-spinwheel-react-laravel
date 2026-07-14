<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SpinQueue extends Model
{
    protected $fillable = [
        'platform',
        'prize_id',
        'sort_order',
        'status',
        'receipt_number',
        'spin_history_id',
    ];

    public function prize()
    {
        return $this->belongsTo(Prize::class);
    }

    public function spinHistory()
    {
        return $this->belongsTo(SpinHistory::class);
    }
}
