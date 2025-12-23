<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompetitorArticle extends Model
{
    protected $fillable = [
        'article_id',
        'source_url',
        'title',
        'content_summary',
    ];

    /**
     * Get the parent article
     */
    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }
}
