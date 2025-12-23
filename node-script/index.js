/**
 * BeyondChats Content Enhancer
 * 
 * Main script that orchestrates the content enhancement workflow:
 * 1. Fetch latest article from Laravel API
 * 2. Search for related articles on Google
 * 3. Scrape content from competitor articles
 * 4. Enhance content using LLM (Gemini)
 * 5. Publish enhanced article back to API
 */

import 'dotenv/config';

import { fetchLatestArticle, fetchArticleById, publishArticle } from './services/articleFetcher.js';
import { searchRelatedArticles } from './services/googleSearcher.js';
import { scrapeMultipleArticles } from './services/contentScraper.js';
import { enhanceArticle, performGapAnalysis } from './services/llmEnhancer.js';

const COMPETITOR_COUNT = 2; // Number of competitor articles to fetch (top 2 from Google)

/**
 * Main enhancement workflow
 */
async function main() {
    console.log('🚀 Starting BeyondChats Content Enhancer...\n');

    try {
        // Step 1: Fetch the latest original article
        console.log('📥 Step 1: Fetching latest article from Laravel API...');
        const article = await fetchLatestArticle();
        console.log(`  Found: "${article.title}"\n`);

        // Step 2: Search for related articles
        console.log('🔍 Step 2: Searching for competitor articles...');
        const searchResults = await searchRelatedArticles(article.title, COMPETITOR_COUNT);

        if (searchResults.length === 0) {
            console.log('⚠️  No competitor articles found. Using fallback enhancement...');
        }
        console.log('');

        // Step 3: Scrape content from competitor articles
        console.log('📰 Step 3: Scraping competitor article content...');
        const competitorArticles = await scrapeMultipleArticles(searchResults);
        console.log('');

        // Step 4: Perform gap analysis
        console.log('🔍 Step 4: Performing gap analysis...');
        const gapAnalysis = await performGapAnalysis(article, competitorArticles);
        console.log(`  Overall Score: ${gapAnalysis.overall_score}/10`);
        console.log(`  Missing Topics: ${gapAnalysis.missing.length}`);
        console.log(`  Improvement Areas: ${gapAnalysis.improve.length}`);
        console.log('');

        // Step 5: Enhance the article
        console.log('✨ Step 5: Enhancing article with AI...');
        const enhanced = await enhanceArticle(article, competitorArticles);
        console.log('');

        // Step 6: Prepare and publish enhanced article
        console.log('📤 Step 6: Publishing enhanced article...');

        const references = competitorArticles.map(c => c.url);

        // Add citation section to the enhanced content
        const citationHtml = generateCitations(competitorArticles);
        const finalContent = enhanced.content + citationHtml;

        const enhancedArticle = await publishArticle({
            title: enhanced.title,
            content: finalContent,
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

        console.log('');
        console.log('🎉 Enhancement complete!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📝 Original: "${article.title}"`);
        console.log(`✨ Enhanced: "${enhanced.title}"`);
        console.log(`🏆 Quality Score: ${gapAnalysis.overall_score}/10`);
        console.log(`📚 References: ${references.length} articles cited`);
        console.log(`🆔 New Article ID: ${enhancedArticle.id}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        return enhancedArticle;

    } catch (error) {
        console.error('\n❌ Enhancement failed:', error.message);
        process.exit(1);
    }
}

/**
 * Generate HTML citations section
 */
function generateCitations(competitors) {
    if (competitors.length === 0) return '';

    const citationList = competitors
        .map((c, i) => `<li><a href="${c.url}" target="_blank" rel="noopener">${c.title}</a></li>`)
        .join('\n    ');

    return `
<hr>
<section class="references">
  <h2>References & Further Reading</h2>
  <p>This article was enhanced using insights from the following sources:</p>
  <ol>
    ${citationList}
  </ol>
</section>`;
}

/**
 * Process a specific article by ID
 */
async function processArticle(articleId) {
    console.log(`🎯 Processing article ID: ${articleId}\n`);

    const article = await fetchArticleById(articleId);
    if (!article) {
        throw new Error(`Article ${articleId} not found`);
    }

    // Follow the same workflow
    const searchResults = await searchRelatedArticles(article.title, COMPETITOR_COUNT);
    const competitorArticles = await scrapeMultipleArticles(searchResults);
    const gapAnalysis = await performGapAnalysis(article, competitorArticles);
    const enhanced = await enhanceArticle(article, competitorArticles);

    const references = competitorArticles.map(c => c.url);
    const citationHtml = generateCitations(competitorArticles);
    const finalContent = enhanced.content + citationHtml;

    const enhancedArticle = await publishArticle({
        title: enhanced.title,
        content: finalContent,
        original_url: article.original_url,
        status: 'updated',
        references,
        gap_analysis: gapAnalysis,
        competitor_articles: competitorArticles.map(c => ({
            source_url: c.url,
            title: c.title,
            content_summary: c.excerpt || c.content?.substring(0, 300),
        })),
    });

    return enhancedArticle;
}

// Run the main function
main().catch(console.error);

export { main, processArticle };
