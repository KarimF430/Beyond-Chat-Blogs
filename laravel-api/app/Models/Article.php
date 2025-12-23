<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Article extends Model
{
    protected $fillable = [
        'title',
        'content',
        'excerpt',
        'author',
        'published_at',
        'featured_image',
        'original_url',
        'status',
        'references',
        'gap_analysis',
    ];

    protected $casts = [
        'references' => 'array',
        'gap_analysis' => 'array',
        'published_at' => 'datetime',
    ];

    /**
     * Get competitor articles used for enhancement
     */
    public function competitorArticles(): HasMany
    {
        return $this->hasMany(CompetitorArticle::class);
    }

    /**
     * Scope for original articles
     */
    public function scopeOriginal($query)
    {
        return $query->where('status', 'original');
    }

    /**
     * Scope for updated articles
     */
    public function scopeUpdated($query)
    {
        return $query->where('status', 'updated');
    }
}
