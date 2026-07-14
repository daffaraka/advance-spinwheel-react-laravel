<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RiggedWinner extends Model
{
    protected $fillable = ['receipt_number', 'platform', 'prize_id', 'is_used'];

    public function prize()
    {
        return $this->belongsTo(Prize::class);
    }
}
