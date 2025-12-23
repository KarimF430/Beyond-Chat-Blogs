/**
 * API Service for fetching articles from Laravel backend
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Fetch all articles
 */
export async function getArticles(status = null) {
    const params = status ? { status } : {};
    const response = await api.get('/articles', { params });
    return response.data.data;
}

/**
 * Fetch a single article by ID
 */
export async function getArticle(id) {
    const response = await api.get(`/articles/${id}`);
    return response.data.data;
}

/**
 * Fetch competitor articles for an article
 */
export async function getCompetitors(articleId) {
    const response = await api.get(`/articles/${articleId}/competitors`);
    return response.data.data;
}

/**
 * Get the latest original article
 */
export async function getLatestArticle() {
    const response = await api.get('/articles-latest');
    return response.data.data;
}

export default api;
