/**
 * Batch Process All Articles
 * 
 * Processes all original articles through the enhancement workflow:
 * 1. Fetch all original articles from Laravel API
 * 2. For each article: search Google, scrape 2 competitors, enhance with LLM
 * 3. Publish enhanced version with citations
 * 4. Track progress and handle errors gracefully
 */

import 'dotenv/config';

import axios from 'axios';
import { searchRelatedArticles } from './services/googleSearcher.js';
import { scrapeMultipleArticles } from './services/contentScraper.js';
import { enhanceArticle, performGapAnalysis } from './services/llmEnhancer.js';

const LARAVEL_API_URL = process.env.LARAVEL_API_URL || 'http://localhost:8000/api';
const COMPETITOR_COUNT = 2;
const DELAY_BETWEEN_ARTICLES = 20000; // 20 seconds delay to avoid rate limits

/**
 * Fetch all original articles from Laravel API
 */
async function fetchAllOriginalArticles() {
    try {
        const response = await axios.get(`${LARAVEL_API_URL}/articles`, {
            params: { status: 'original', per_page: 200 }
        });
        return response.data.data || response.data;
    } catch (error) {
        console.error('Failed to fetch articles:', error.message);
        throw error;
    }
}

/**
 * Publish enhanced article via API
 */
async function publishArticle(articleData) {
    const response = await axios.post(`${LARAVEL_API_URL}/articles`, articleData);
    return response.data;
}

/**
 * Generate HTML citations section
 */
function generateCitations(competitors) {
    if (competitors.length === 0) return '';

    const citationList = competitors
        .map((c, i) => `<li><a href="${c.url}" target="_blank" rel="noopener">${c.title}</a> - ${new URL(c.url).hostname}</li>`)
        .join('\n    ');

    return `
<hr>
<section class="references">
  <h2>📚 References & Sources</h2>
  <p>This article was enhanced using insights from the following top-ranking sources:</p>
  <ol>
    ${citationList}
  </ol>
</section>`;
}

/**
 * Process a single article
 */
async function processArticle(article, index, total) {
    console.log(`\n[${index + 1}/${total}] Processing: "${article.title.substring(0, 50)}..."`);

    try {
        // Step 1: Search for competitor articles
        console.log('  🔍 Searching Google for competitors...');
        const searchResults = await searchRelatedArticles(article.title, COMPETITOR_COUNT);

        if (searchResults.length === 0) {
            console.log('  ⚠️ No competitor articles found, skipping...');
            return { success: false, reason: 'No competitors found' };
        }

        // Step 2: Scrape competitor content
        console.log(`  📰 Scraping ${searchResults.length} competitor articles...`);
        const competitorArticles = await scrapeMultipleArticles(searchResults);

        if (competitorArticles.length === 0) {
            console.log('  ⚠️ Could not scrape any competitor content, skipping...');
            return { success: false, reason: 'Scraping failed' };
        }

        // Step 3: Perform gap analysis
        console.log('  🔍 Analyzing SEO gaps...');
        const gapAnalysis = await performGapAnalysis(article, competitorArticles);
        console.log(`    Score: ${gapAnalysis.overall_score}/10`);

        // Step 4: Enhance with LLM
        console.log('  ✨ Enhancing with AI...');
        const enhanced = await enhanceArticle(article, competitorArticles);

        // Step 5: Prepare and publish
        console.log('  📤 Publishing enhanced article...');
        const references = competitorArticles.map(c => c.url);
        const citationHtml = generateCitations(competitorArticles);
        const finalContent = enhanced.content + citationHtml;

        const enhancedArticle = await publishArticle({
            title: enhanced.title,
            content: finalContent,
            excerpt: article.excerpt,
            author: article.author,
            published_at: article.published_at,
            featured_image: article.featured_image,
            original_url: article.original_url,
            status: 'updated',
            references: references,
            gap_analysis: gapAnalysis,
            competitor_articles: competitorArticles.map(c => ({
                source_url: c.url,
                title: c.title,
                content_summary: c.excerpt || c.content?.substring(0, 300),
            })),
        });

        console.log(`  ✅ Enhanced! New ID: ${enhancedArticle.id}, Score: ${gapAnalysis.overall_score}/10`);
        return { success: true, articleId: enhancedArticle.id, score: gapAnalysis.overall_score };

    } catch (error) {
        console.error(`  ❌ Failed: ${error.message}`);
        return { success: false, reason: error.message };
    }
}

/**
 * Sleep helper
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main batch processing function
 */
async function main() {
    console.log('🚀 Starting Batch Article Enhancement\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Fetch all original articles
    console.log('📥 Fetching all original articles...');
    const articles = await fetchAllOriginalArticles();
    console.log(`📊 Found ${articles.length} original articles to process\n`);

    const results = {
        success: 0,
        failed: 0,
        skipped: 0,
        errors: []
    };

    // Process each article
    for (let i = 0; i < articles.length; i++) {
        const result = await processArticle(articles[i], i, articles.length);

        if (result.success) {
            results.success++;
        } else {
            results.failed++;
            results.errors.push({
                title: articles[i].title,
                reason: result.reason
            });
        }

        // Add delay between articles to avoid rate limits
        if (i < articles.length - 1) {
            console.log(`  ⏳ Waiting ${DELAY_BETWEEN_ARTICLES / 1000}s before next article...`);
            await sleep(DELAY_BETWEEN_ARTICLES);
        }
    }

    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 BATCH PROCESSING COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Successfully enhanced: ${results.success}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📝 Total processed: ${articles.length}`);

    if (results.errors.length > 0) {
        console.log('\nFailed articles:');
        results.errors.forEach(e => console.log(`  - ${e.title}: ${e.reason}`));
    }

    return results;
}

// Run
main().catch(console.error);
