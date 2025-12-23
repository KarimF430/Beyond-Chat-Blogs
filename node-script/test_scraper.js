import { scrapeArticleContent } from './services/contentScraper.js';

async function test() {
    console.log('Testing scraper...');
    const url = 'https://www.tidio.com/blog/chatbot-vs-live-chat/'; // One of the competitor URLs
    const result = await scrapeArticleContent(url);
    console.log('Title:', result.title);
    console.log('Image URL:', result.image_url);

    if (result.image_url) {
        console.log('✅ Image extracted successfully!');
    } else {
        console.log('❌ No image extracted.');
    }
}

test();
