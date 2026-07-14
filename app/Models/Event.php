<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'platform',
        'status',
    ];

    public function details()
    {
        return $this->hasMany(EventDetail::class)->orderBy('sort_order')->orderBy('id');
    }
}
