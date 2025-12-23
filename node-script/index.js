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
            // Preserve original article metadata
            featured_image: article.featured_image,
            author: article.author,
            published_at: article.published_at,
            excerpt: article.excerpt,
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

    const citationCards = competitors
        .map((c, i) => {
            const hostname = new URL(c.url).hostname;
            const snippet = c.snippet || c.excerpt || 'Read the full article to learn more.';
            // Clean up snippet if it's too long
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
