<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventDetail extends Model
{
    protected $fillable = [
        'event_id',
        'prize_id',
        'participant_id',
        'sort_order',
        'status',
        'spin_history_id',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function prize()
    {
        return $this->belongsTo(Prize::class);
    }

    public function participant()
    {
        return $this->belongsTo(Participant::class);
    }

    public function spinHistory()
    {
        return $this->belongsTo(SpinHistory::class);
    }
}
