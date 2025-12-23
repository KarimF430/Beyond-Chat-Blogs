<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\CompetitorArticle;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\ArticleScraper;

class ArticleController extends Controller
{
    /**
     * Display a listing of articles.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Article::with('competitorArticles');
        
        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        $articles = $query->orderBy('created_at', 'desc')->get();
        
        return response()->json([
            'success' => true,
            'data' => $articles
        ]);
    }

    /**
     * Store a newly created article.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:500',
            'content' => 'required|string',
            'original_url' => 'nullable|url',
            'status' => 'in:original,updated',
            'references' => 'nullable|array',
            'gap_analysis' => 'nullable|array',
            'featured_image' => 'nullable|url',
            'author' => 'nullable|string',
            'published_at' => 'nullable|date',
            'excerpt' => 'nullable|string',
        ]);

        $article = Article::create($validated);

        // If competitor articles are provided, create them
        if ($request->has('competitor_articles')) {
            foreach ($request->competitor_articles as $competitor) {
                CompetitorArticle::create([
                    'article_id' => $article->id,
                    'source_url' => $competitor['source_url'],
                    'title' => $competitor['title'],
                    'content_summary' => $competitor['content_summary'] ?? null,
                    'image_url' => $competitor['image_url'] ?? null,
                ]);
            }
        }
        
        // Auto-generate slug if not provided/exists
        if (!$article->slug) {
            $slug = \Illuminate\Support\Str::slug($article->title);
            if ($article->original_url) {
                $path = parse_url($article->original_url, PHP_URL_PATH);
                $urlSlug = basename(rtrim($path, "/"));
                if ($urlSlug) $slug = $urlSlug;
            }
            // Ensure unique
            $count = Article::where('slug', $slug)->where('id', '!=', $article->id)->count();
            if ($count > 0) $slug .= '-' . $article->id;
            
            $article->slug = $slug;
            $article->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Article created successfully',
            'data' => $article->load('competitorArticles')
        ], 201);
    }

    /**
     * Display the specified article.
     */
    public function show(string $id): JsonResponse
    {
        $article = Article::with('competitorArticles')
                    ->where('id', $id)
                    ->orWhere('slug', $id)
                    ->first();
        
        if (!$article) {
            return response()->json([
                'success' => false,
                'message' => 'Article not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $article
        ]);
    }

    /**
     * Update the specified article.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $article = Article::where('id', $id)->orWhere('slug', $id)->first();
        
        if (!$article) {
            return response()->json([
                'success' => false,
                'message' => 'Article not found'
            ], 404);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:500',
            'content' => 'sometimes|string',
            'original_url' => 'nullable|url',
            'status' => 'in:original,updated',
            'references' => 'nullable|array',
            'gap_analysis' => 'nullable|array',
            'featured_image' => 'nullable|url',
            'author' => 'nullable|string',
            'published_at' => 'nullable|date',
            'excerpt' => 'nullable|string',
        ]);

        $article->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Article updated successfully',
            'data' => $article->load('competitorArticles')
        ]);
    }

    /**
     * Remove the specified article.
     */
    public function destroy(string $id): JsonResponse
    {
        $article = Article::where('id', $id)->orWhere('slug', $id)->first();
        
        if (!$article) {
            return response()->json([
                'success' => false,
                'message' => 'Article not found'
            ], 404);
        }

        $article->delete();

        return response()->json([
            'success' => true,
            'message' => 'Article deleted successfully'
        ]);
    }

    /**
     * Get the latest original article (for Node.js script)
     */
    public function latest(): JsonResponse
    {
        $article = Article::where('status', 'original')
            ->orderBy('created_at', 'desc')
            ->first();
        
        if (!$article) {
            return response()->json([
                'success' => false,
                'message' => 'No original articles found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $article
        ]);
    }

    /**
     * Get competitor articles for a specific article
     */
    public function competitors(string $id): JsonResponse
    {
        $article = Article::where('id', $id)->orWhere('slug', $id)->first();
        
        if (!$article) {
            return response()->json([
                'success' => false,
                'message' => 'Article not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $article->competitorArticles
        ]);
    }

    /**
     * Scrape articles from BeyondChats
     */
    public function scrape(): JsonResponse
    {
        try {
            $scraper = new ArticleScraper();
            $articles = $scraper->scrapeOldestArticles(5);
            
            return response()->json([
                'success' => true,
                'message' => 'Scraped ' . count($articles) . ' articles successfully',
                'data' => $articles
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Scraping failed: ' . $e->getMessage()
            ], 500);
        }
    }
}
