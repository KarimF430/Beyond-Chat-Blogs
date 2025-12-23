/**
 * LLM Enhancer Service
 * Uses Google Gemini to enhance article content
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let genAI = null;

/**
 * Initialize the Gemini AI client
 */
function initializeClient() {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
        throw new Error('GEMINI_API_KEY is not set. Please add it to your .env file.');
    }

    if (!genAI) {
        genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    }

    return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
}

/**
 * Enhance article content using competitor articles as reference
 */
export async function enhanceArticle(originalArticle, competitorArticles) {
    console.log('🤖 Enhancing article with Gemini AI...');

    const model = initializeClient();

    // Prepare competitor content summaries
    const competitorContent = competitorArticles
        .map((c, i) => `
--- Reference Article ${i + 1}: "${c.title}" ---
URL: ${c.url}
Content Summary:
${c.content?.substring(0, 2000) || c.snippet}
`)
        .join('\n');

    const prompt = `You are a professional SEO content editor specializing in creating human-like, engaging blog articles.

## Original Article
Title: ${originalArticle.title}
Content:
${stripHtml(originalArticle.content).substring(0, 5000)}

## Reference Articles (Top-ranking competitors)
${competitorContent}

## Your Task
Rewrite and enhance the original article to:
1. **Improve SEO**: Better headings (H2, H3), keyword optimization, meta-friendly structure
2. **Human Writing Style**: Conversational tone, engaging flow, avoid robotic AI-sounding text
3. **Add Value**: Include insights from reference articles WITHOUT copying
4. **Better Structure**: Clear introduction, numbered/bulleted lists, conclusion with CTA
5. **Increase Depth**: Add relevant statistics, examples, or use cases

## IMPORTANT RULES
- DO NOT copy sentences from reference articles
- Write in a natural, human voice
- Use active voice and engaging transitions
- Keep paragraphs short (2-4 sentences max)
- Output ONLY the enhanced article in clean HTML format
- Start with a compelling H1 title

## Output Format
Return ONLY the enhanced HTML article content. No explanations, just the article.`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const enhancedContent = response.text();

        console.log('✅ Article enhanced successfully');

        return {
            content: enhancedContent,
            title: extractTitle(enhancedContent) || `Enhanced: ${originalArticle.title}`,
        };
    } catch (error) {
        console.error('Error enhancing article:', error.message);
        throw error;
    }
}

/**
 * Perform gap analysis comparing original article to competitors
 */
export async function performGapAnalysis(originalArticle, competitorArticles) {
    console.log('🔍 Performing gap analysis...');

    const model = initializeClient();

    const competitorContent = competitorArticles
        .map((c, i) => `
Article ${i + 1}: "${c.title}"
Key Topics: ${c.content?.substring(0, 1500) || c.snippet}
`)
        .join('\n');

    const prompt = `Analyze the original article against these competitor articles and identify gaps.

## Original Article
Title: ${originalArticle.title}
Content Summary:
${stripHtml(originalArticle.content).substring(0, 3000)}

## Competitor Articles
${competitorContent}

## Analysis Task
Compare the original with competitors and return a JSON object with:
1. "missing" - Topics/points competitors cover that the original doesn't (array of strings)
2. "improve" - Areas where original could be stronger (array of strings)
3. "strengths" - What the original does well (array of strings)
4. "keywords_missing" - Important keywords/phrases competitors use that we don't (array)
5. "overall_score" - Quality score 1-10 compared to competitors
6. "recommendations" - Top 3 specific improvements (array)

Return ONLY valid JSON, no markdown formatting or explanation.`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let analysisText = response.text();

        // Clean up potential markdown formatting
        analysisText = analysisText
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        const analysis = JSON.parse(analysisText);
        console.log('✅ Gap analysis complete');

        return {
            missing: analysis.missing || [],
            improve: analysis.improve || [],
            strengths: analysis.strengths || [],
            keywords_missing: analysis.keywords_missing || [],
            overall_score: analysis.overall_score || 5,
            recommendations: analysis.recommendations || [],
        };
    } catch (error) {
        console.error('Error in gap analysis:', error.message);

        // Return a default structure if parsing fails
        return {
            missing: ['Unable to analyze - please check API key'],
            improve: [],
            strengths: [],
            keywords_missing: [],
            overall_score: 0,
            recommendations: [],
            error: error.message,
        };
    }
}

/**
 * Strip HTML tags from content
 */
function stripHtml(html) {
    return html
        ?.replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim() || '';
}

/**
 * Extract H1 title from HTML content
 */
function extractTitle(html) {
    const match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    return match ? stripHtml(match[1]) : null;
}

export { stripHtml };
