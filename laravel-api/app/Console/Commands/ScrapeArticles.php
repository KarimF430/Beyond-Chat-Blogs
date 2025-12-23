<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\ArticleScraper;

class ScrapeArticles extends Command
{
    protected $signature = 'scrape:articles {--count=100 : Number of articles to scrape}';
    protected $description = 'Scrape articles from BeyondChats blog';

    public function handle()
    {
        $this->info('Scraping articles from BeyondChats...');
        
        $scraper = new ArticleScraper();
        
        try {
            $articles = $scraper->scrapeOldestArticles(
                (int) $this->option('count')
            );
            
            $this->info("Successfully scraped " . count($articles) . " articles.");
            
            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error("Failed to scrape: " . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
