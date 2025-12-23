<?php

namespace App\Services;

use App\Models\Article;
use Illuminate\Support\Facades\Http;

class ArticleScraper
{
    private string $baseUrl = 'https://beyondchats.com/wp-json/wp/v2/posts';

    /**
     * Scrape ALL articles from BeyondChats blog (multiple pages)
     */
    public function scrapeOldestArticles(int $count = 100): array
    {
        $allPosts = [];
        $page = 1;
        $perPage = 100; // Max allowed by WordPress API

        // Fetch all pages
        do {
            $response = Http::get($this->baseUrl, [
                'per_page' => $perPage,
                'page' => $page,
                'orderby' => 'date',
                'order' => 'asc',
                '_embed' => true,
            ]);

            if (!$response->successful()) {
                break; // No more pages
            }

            $posts = $response->json();
            if (empty($posts)) {
                break;
            }

            $allPosts = array_merge($allPosts, $posts);
            $page++;

            // WordPress returns total pages in header
            $totalPages = (int) $response->header('X-WP-TotalPages');
            
        } while ($page <= $totalPages);

        if (empty($allPosts)) {
            throw new \Exception('Failed to fetch articles from BeyondChats API');
        }
        $articles = [];

        foreach ($allPosts as $post) {
            // Check if article already exists
            $existing = Article::where('original_url', $post['link'])->first();
            
            // Extract excerpt from WordPress
            $excerpt = isset($post['excerpt']['rendered']) 
                ? strip_tags(html_entity_decode($post['excerpt']['rendered'], ENT_QUOTES, 'UTF-8'))
                : null;
            $excerpt = $excerpt ? trim($excerpt) : null;
            
            if ($existing) {
                // Update featured image and excerpt if missing
                $updates = [];
                if (!$existing->featured_image) {
                    $featuredImage = $this->extractFeaturedImage($post);
                    if ($featuredImage) {
                        $updates['featured_image'] = $featuredImage;
                    }
                }
                if (!$existing->excerpt && $excerpt) {
                    $updates['excerpt'] = $excerpt;
                }
                if (!empty($updates)) {
                    $existing->update($updates);
                }
                $articles[] = $existing;
                continue;
            }

            // Extract content
            $title = html_entity_decode($post['title']['rendered'], ENT_QUOTES, 'UTF-8');
            $content = $post['content']['rendered'];
            $featuredImage = $this->extractFeaturedImage($post);

            // Create new article
            $article = Article::create([
                'title' => $title,
                'content' => $content,
                'excerpt' => $excerpt,
                'featured_image' => $featuredImage,
                'original_url' => $post['link'],
                'status' => 'original',
            ]);

            $articles[] = $article;
        }

        return $articles;
    }

    /**
     * Extract featured image URL from WordPress post _embedded data
     */
    private function extractFeaturedImage(array $post): ?string
    {
        // Try to get from _embedded wp:featuredmedia
        if (isset($post['_embedded']['wp:featuredmedia'][0]['source_url'])) {
            return $post['_embedded']['wp:featuredmedia'][0]['source_url'];
        }

        // Try medium_large size for better performance
        if (isset($post['_embedded']['wp:featuredmedia'][0]['media_details']['sizes']['medium_large']['source_url'])) {
            return $post['_embedded']['wp:featuredmedia'][0]['media_details']['sizes']['medium_large']['source_url'];
        }

        // Try to extract first image from content
        preg_match('/<img[^>]+src="([^">]+)"/', $post['content']['rendered'], $matches);
        if (!empty($matches[1])) {
            return $matches[1];
        }

        return null;
    }

    /**
     * Get a single article content by URL (for debugging)
     */
    public function fetchArticleContent(string $url): ?array
    {
        $path = parse_url($url, PHP_URL_PATH);
        $slug = trim($path, '/');
        $slug = basename($slug);

        $response = Http::get($this->baseUrl, [
            'slug' => $slug,
            '_embed' => true,
        ]);

        if (!$response->successful() || empty($response->json())) {
            return null;
        }

        $post = $response->json()[0];

        return [
            'title' => html_entity_decode($post['title']['rendered'], ENT_QUOTES, 'UTF-8'),
            'content' => $post['content']['rendered'],
            'featured_image' => $this->extractFeaturedImage($post),
            'url' => $post['link'],
            'date' => $post['date'],
        ];
    }
}
