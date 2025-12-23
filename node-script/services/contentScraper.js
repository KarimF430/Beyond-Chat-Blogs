/**
 * Content Scraper Service
 * Extracts main content from article URLs using Readability
 */

import axios from 'axios';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import * as cheerio from 'cheerio';

/**
 * Scrape content from multiple URLs
 */
export async function scrapeMultipleArticles(urls) {
    console.log(`📰 Scraping ${urls.length} articles...`);

    const results = [];

    for (const urlInfo of urls) {
        try {
            const content = await scrapeArticleContent(urlInfo.url);
            if (content) {
                results.push({
                    ...urlInfo,
                    content: content.textContent,
                    htmlContent: content.content,
                    excerpt: content.excerpt || urlInfo.snippet,
                    image_url: content.image_url,
                });
                console.log(`  ✅ Scraped: ${urlInfo.title.substring(0, 50)}...`);
            }
        } catch (error) {
            console.log(`  ❌ Failed to scrape: ${urlInfo.url}`);
        }
    }

    console.log(`✅ Successfully scraped ${results.length} articles`);
    return results;
}

/**
 * Scrape main content from a single article URL
 */
export async function scrapeArticleContent(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            },
            timeout: 15000,
        });

        const dom = new JSDOM(response.data, { url });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        // Extract image (og:image or first image)
        let imageUrl = null;
        const metaImage = dom.window.document.querySelector('meta[property="og:image"]');
        if (metaImage) {
            imageUrl = metaImage.getAttribute('content');
        } else {
            const firstImg = dom.window.document.querySelector('article img, main img, .post-content img');
            if (firstImg) {
                imageUrl = firstImg.getAttribute('src');
            }
        }

        if (article) {
            return {
                title: article.title,
                content: article.content,
                textContent: cleanText(article.textContent),
                excerpt: article.excerpt,
                byline: article.byline,
                length: article.length,
                image_url: imageUrl,
            };
        }

        // Fallback: Use Cheerio to extract content manually
        return fallbackExtraction(response.data, url);
    } catch (error) {
        console.error(`Error scraping ${url}:`, error.message);
        return null;
    }
}

/**
 * Fallback extraction using Cheerio
 */
function fallbackExtraction(html, url) {
    const $ = cheerio.load(html);

    // Remove scripts, styles, and ads
    $('script, style, nav, header, footer, aside, .ads, .advertisement, .sidebar').remove();

    // Try common content selectors
    const contentSelectors = [
        'article',
        '.post-content',
        '.article-content',
        '.entry-content',
        '.content-area',
        'main',
        '.blog-post',
    ];

    let content = '';
    for (const selector of contentSelectors) {
        const el = $(selector);
        if (el.length && el.text().length > 500) {
            content = el.text();
            break;
        }
    }

    if (!content) {
        // Get all paragraphs
        content = $('p').map((i, el) => $(el).text()).get().join('\n\n');
    }

    const title = $('h1').first().text() || $('title').text();

    return {
        title: title.trim(),
        content: content,
        textContent: cleanText(content),
        excerpt: content.substring(0, 200),
        byline: null,
        length: content.length,
    };
}

/**
 * Clean and normalize text content
 */
function cleanText(text) {
    return text
        .replace(/\s+/g, ' ')       // Normalize whitespace
        .replace(/\n\s*\n/g, '\n\n') // Normalize paragraph breaks
        .replace(/^\s+|\s+$/g, '')   // Trim
        .substring(0, 10000);        // Limit length for LLM context
}

export { cleanText };
