/**
 * Google Search Service
 * Searches for related articles using Google
 * Note: For production, use SerpAPI or similar service to avoid rate limiting
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

const SERP_API_KEY = process.env.SERP_API_KEY;

/**
 * Search Google for articles related to the given title
 * Uses SerpAPI if key is available, otherwise falls back to DuckDuckGo
 */
export async function searchRelatedArticles(title, count = 5) {
    console.log(`🔍 Searching for articles related to: "${title}"`);

    if (SERP_API_KEY && SERP_API_KEY !== 'your_serpapi_key_here') {
        return await searchWithSerpAPI(title, count);
    }

    // Fallback to DuckDuckGo (no API key required)
    return await searchWithDuckDuckGo(title, count);
}

/**
 * Search using SerpAPI (recommended for production)
 */
async function searchWithSerpAPI(query, count) {
    try {
        const response = await axios.get('https://serpapi.com/search', {
            params: {
                q: query + ' blog article',
                api_key: SERP_API_KEY,
                num: count + 5, // Get extra to filter
                engine: 'google',
            }
        });

        const results = response.data.organic_results || [];

        // Filter to get only blog/article pages
        const filteredResults = results
            .filter(r => isBlogOrArticle(r.link, r.title))
            .slice(0, count)
            .map(r => ({
                title: r.title,
                url: r.link,
                snippet: r.snippet || '',
            }));

        console.log(`✅ Found ${filteredResults.length} articles via SerpAPI`);
        return filteredResults;
    } catch (error) {
        console.error('SerpAPI search failed:', error.message);
        return await searchWithDuckDuckGo(query, count);
    }
}

/**
 * Search using DuckDuckGo (free, no API key)
 */
async function searchWithDuckDuckGo(query, count) {
    try {
        const searchQuery = encodeURIComponent(query + ' blog article guide');
        const url = `https://html.duckduckgo.com/html/?q=${searchQuery}`;

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const results = [];

        $('.result').each((i, element) => {
            if (results.length >= count + 5) return false;

            const titleEl = $(element).find('.result__title a');
            const snippetEl = $(element).find('.result__snippet');

            const title = titleEl.text().trim();
            let url = titleEl.attr('href');
            const snippet = snippetEl.text().trim();

            // DuckDuckGo uses redirect URLs, extract the actual URL
            if (url && url.includes('uddg=')) {
                const match = url.match(/uddg=([^&]+)/);
                if (match) {
                    url = decodeURIComponent(match[1]);
                }
            }

            if (url && title && isBlogOrArticle(url, title)) {
                results.push({ title, url, snippet });
            }
        });

        const finalResults = results.slice(0, count);
        console.log(`✅ Found ${finalResults.length} articles via DuckDuckGo`);
        return finalResults;
    } catch (error) {
        console.error('DuckDuckGo search failed:', error.message);
        return [];
    }
}

/**
 * Check if a URL is likely a blog or article page
 */
function isBlogOrArticle(url, title = '') {
    const lowerUrl = url.toLowerCase();
    const lowerTitle = title.toLowerCase();

    // Exclude non-article pages
    const excludePatterns = [
        'youtube.com', 'youtu.be',
        'twitter.com', 'x.com',
        'facebook.com', 'instagram.com',
        'linkedin.com/company', 'linkedin.com/in/',
        '.pdf', '.doc', '.ppt',
        'wikipedia.org',
        '/login', '/signup', '/register',
        '/shop', '/product', '/cart',
        'amazon.com', 'ebay.com',
    ];

    if (excludePatterns.some(pattern => lowerUrl.includes(pattern))) {
        return false;
    }

    // Include likely article URLs
    const includePatterns = [
        '/blog', '/article', '/post', '/news',
        '/guide', '/how-to', '/tutorial',
        '/insights', '/resources', '/learn',
    ];

    if (includePatterns.some(pattern => lowerUrl.includes(pattern))) {
        return true;
    }

    // Check title for article-like patterns
    const articleKeywords = ['how to', 'guide', 'tips', 'ways', 'best', 'top', 'complete'];
    if (articleKeywords.some(kw => lowerTitle.includes(kw))) {
        return true;
    }

    // Default to true if it looks like a content page
    return !lowerUrl.endsWith('/') || lowerUrl.split('/').length > 4;
}

export { isBlogOrArticle };
