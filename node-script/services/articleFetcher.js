/**
 * Article Fetcher Service
 * Fetches articles from the Laravel API
 */

import axios from 'axios';

const API_URL = process.env.LARAVEL_API_URL || 'http://127.0.0.1:8000/api';

/**
 * Fetch the latest original article from Laravel API
 */
export async function fetchLatestArticle() {
    try {
        const response = await axios.get(`${API_URL}/articles-latest`);

        if (response.data.success) {
            return response.data.data;
        }

        throw new Error('No articles found');
    } catch (error) {
        console.error('Error fetching latest article:', error.message);
        throw error;
    }
}

/**
 * Fetch all articles from Laravel API
 */
export async function fetchAllArticles() {
    try {
        const response = await axios.get(`${API_URL}/articles`);

        if (response.data.success) {
            return response.data.data;
        }

        return [];
    } catch (error) {
        console.error('Error fetching articles:', error.message);
        throw error;
    }
}

/**
 * Fetch a single article by ID
 */
export async function fetchArticleById(id) {
    try {
        const response = await axios.get(`${API_URL}/articles/${id}`);

        if (response.data.success) {
            return response.data.data;
        }

        throw new Error(`Article ${id} not found`);
    } catch (error) {
        console.error(`Error fetching article ${id}:`, error.message);
        throw error;
    }
}

/**
 * Publish an enhanced article to Laravel API
 */
export async function publishArticle(articleData) {
    try {
        const response = await axios.post(`${API_URL}/articles`, articleData);

        if (response.data.success) {
            console.log('✅ Article published successfully');
            return response.data.data;
        }

        throw new Error('Failed to publish article');
    } catch (error) {
        console.error('Error publishing article:', error.message);
        throw error;
    }
}

/**
 * Update an existing article
 */
export async function updateArticle(id, articleData) {
    try {
        const response = await axios.put(`${API_URL}/articles/${id}`, articleData);

        if (response.data.success) {
            console.log(`✅ Article ${id} updated successfully`);
            return response.data.data;
        }

        throw new Error(`Failed to update article ${id}`);
    } catch (error) {
        console.error(`Error updating article ${id}:`, error.message);
        throw error;
    }
}
