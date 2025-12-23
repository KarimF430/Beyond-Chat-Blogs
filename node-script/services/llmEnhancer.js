/**
 * LLM Enhancer Service
 * Uses Groq (free tier) with Llama 3 for article enhancement
 */

import Groq from 'groq-sdk';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

let groq = null;

/**
 * Initialize the Groq client
 */
function initializeClient() {
    if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_api_key_here') {
        throw new Error('GROQ_API_KEY is not set. Get a free key at https://console.groq.com/keys');
    }

    if (!groq) {
        groq = new Groq({ apiKey: GROQ_API_KEY });
    }

    return groq;
}

/**
 * Enhance article content using competitor articles as reference
 */
export async function enhanceArticle(originalArticle, competitorArticles) {
    console.log('🤖 Enhancing article with Llama 3 (via Groq)...');

    const client = initializeClient();

    // Prepare competitor content summaries
    const competitorContent = competitorArticles
        .map((c, i) => `
--- Reference Article ${i + 1}: "${c.title}" ---
URL: ${c.url}
Content Summary:
${c.content?.substring(0, 2000) || c.snippet}
`)
        .join('\n');

    const prompt = `You are an expert Content Editor & SEO Specialist. Your task is to scientifically enhance a blog article by comparing it against top-ranking competitors text-by-text.

## CORE OBJECTIVE
1. **Understand**: Fully scan the Original Article's header and content to grasp the core topic and flow.
2. **Compare**: Scan the Competitor Articles provided. For each section/point, check:
   - "Does the competitor explain this better?"
   - "Does the competitor include valid points/examples/statistics we missed?"
3. **Enhance**: If you find better explanations or missing points, **MERGE** them into our article.
   - **UNIQUE WRITING**: Do NOT copy-paste. Rewrite the new points in the same friendly tone as our article to make it 100% unique.
   - **SEO**: Ensure the new text uses natural semantic keywords.
4. **PRESERVE**: Do NOT cut, shorten, or remove existing content. Your job is to ADD value, not reduce it. Keep the article "Fullest".

## 1. Original Article (DO NOT MODIFY EXISTING HTML STRUCTURE)
Title: ${originalArticle.title}
Full Content:
${originalArticle.content.substring(0, 100000)}

## 2. Top Ranking Competitors (SOURCE MATERIAL)
${competitorContent}

## 3. Enhancement Rules (STRICT ALGORITHM)
- **Step 1**: Identify gaps. If competitors talk about "X" and we don't, add a paragraph about "X".
- **Step 2**: Identify quality gaps. If competitors have a "Pro Tip" or "Statistic" we lack, add it.
- **Step 3**: **Insert** the new content naturally between existing paragraphs or sections.
- **Step 4**: **HIGHLIGHTING (CRITICAL)**: You MUST wrap **ALL** newly added sentences or paragraphs in `< mark > ` tags.
    - If you add a new sentence: `< mark > New sentence here.</mark> `
    - If you rewrite a paragraph significantly: `< mark > Full rewritten paragraph here.</mark > `
    - **DO NOT MISS THIS STEP.** Visual highlighting is the most important requirement.

## 4. Output Requirements
- Return the **FULL HTML** of the article with your enhancements.
- **Keep ALL original <img> tags exactly where they are.**
- **Keep ALL original headings and structure.**
- **Writing Style**: Conversational, friendly, human-like (use "you", "we", contractions).
- **Formatting**: Output valid HTML only. No markdown blocks.`;

    try {
        const chatCompletion = await client.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 30000,
        });

        const enhancedContent = chatCompletion.choices[0]?.message?.content || '';

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
    console.log('🔍 Performing gap analysis with Llama 3...');

    const client = initializeClient();

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
        const chatCompletion = await client.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.3,
            max_tokens: 2000,
        });

        let analysisText = chatCompletion.choices[0]?.message?.content || '{}';

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
