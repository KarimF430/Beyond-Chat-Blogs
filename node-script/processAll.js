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

    const citationCards = competitors
        .map((c, i) => {
            const hostname = new URL(c.url).hostname;
            const snippet = c.snippet || c.excerpt || 'Read the full article to learn more.';
            const cleanSnippet = snippet.length > 120 ? snippet.substring(0, 120) + '...' : snippet;

            const imageHtml = c.image_url
                ? `<img src="${c.image_url}" alt="${c.title}" loading="lazy" onerror="this.style.display='none';this.parentElement.querySelector('.related-image-placeholder').style.display='flex'">
                   <div class="related-image-placeholder" style="display:none">${c.title}</div>`
                : `<div class="related-image-placeholder">${c.title}</div>`;

            return `
    <a href="${c.url}" target="_blank" rel="noopener" class="related-article-card">
        <div class="related-image">
            ${imageHtml}
        </div>
        <div style="padding: 1rem;">
            <h3>${c.title}</h3>
            <div class="related-meta">Source: ${hostname}</div>
            <p class="related-excerpt">${cleanSnippet}</p>
        </div>
    </a>`;
        })
        .join('\n');

    return `
<section class="related-articles-section">
  <h2>Reference Articles</h2>
  <p class="section-subtitle">These articles were analyzed by our AI to enhance the content above</p>
  <div class="related-articles-grid">
    ${citationCards}
  </div>
  <button class="see-more-btn" onclick="window.open('${competitors[0].url}', '_blank')">See more recommendations</button>
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

    // Fetch already enhanced articles to avoid duplicates
    let alreadyEnhancedUrls = new Set();
    try {
        const enhancedResponse = await axios.get(`${LARAVEL_API_URL}/articles`, {
            params: { status: 'updated', per_page: 200 }
        });
        const enhancedArticles = enhancedResponse.data.data || enhancedResponse.data;
        enhancedArticles.forEach(a => {
            if (a.original_url) alreadyEnhancedUrls.add(a.original_url);
        });
        console.log(`ℹ️ Found ${enhancedArticles.length} already enhanced articles.`);
    } catch (e) {
        console.warn('⚠️ Could not fetch existing enhanced articles, proceeding without duplicate check.');
    }

    // Filter articles
    const articlesToProcess = articles.filter(a => !alreadyEnhancedUrls.has(a.original_url));
    console.log(`📊 Found ${articles.length} originals, ${articlesToProcess.length} pending enhancement.\n`);

    const results = {
        success: 0,
        failed: 0,
        skipped: articles.length - articlesToProcess.length,
        errors: []
    };

    // Process each article
    for (let i = 0; i < articlesToProcess.length; i++) {
        const result = await processArticle(articlesToProcess[i], i, articlesToProcess.length);

        if (result.success) {
            results.success++;
        } else {
            results.failed++;
            results.errors.push({
                title: articles[i].title,
                reason: result.reason
            });
        }

        if (results.success >= 10) {
            console.log('🛑 Reached limit of 10 articles. Stopping.');
            break;
        }

        // Add delay between articles to avoid rate limits
        if (i < articlesToProcess.length - 1) {
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
