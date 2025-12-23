import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getArticles } from '../services/api';
import ArticleCard from '../components/ArticleCard';
import Footer from '../components/Footer';
import './HomePage.css';

export default function HomePage() {
    const [articles, setArticles] = useState([]);
    const [filter, setFilter] = useState('updated');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [topicFilter, setTopicFilter] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const articlesPerPage = 10;

    useEffect(() => {
        fetchArticles();
    }, []);

    async function fetchArticles() {
        try {
            setLoading(true);
            const data = await getArticles();
            setArticles(data);
        } catch (error) {
            console.error('Failed to fetch articles:', error);
        } finally {
            setLoading(false);
        }
    }

    // Filter and search articles, then sort by date (newest first)
    const filteredArticles = articles
        .filter(a => filter === 'all' || a.status === filter)
        .filter(a =>
            searchQuery === '' ||
            a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .filter(a =>
            topicFilter === '' ||
            a.title?.toLowerCase().includes(topicFilter.toLowerCase()) ||
            a.excerpt?.toLowerCase().includes(topicFilter.toLowerCase())
        )
        .sort((a, b) => {
            const dateA = new Date(a.published_at || a.created_at);
            const dateB = new Date(b.published_at || b.created_at);
            return dateB - dateA; // Newest first
        });

    // Pagination
    const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);
    const startIndex = (currentPage - 1) * articlesPerPage;
    const paginatedArticles = filteredArticles.slice(startIndex, startIndex + articlesPerPage);

    const originalCount = articles.filter(a => a.status === 'original').length;
    const updatedCount = articles.filter(a => a.status === 'updated').length;

    // Reset to page 1 when filter or search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filter, searchQuery, topicFilter]);

    // Generate page numbers
    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                pages.push(i);
            }
            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="home-page">
            {/* Header */}
            <header className="header">
                <Link to="/" className="logo">
                    <div className="logo-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.36 5.07L2 22l4.93-1.36C8.42 21.5 10.15 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.58 0-3.08-.42-4.38-1.17l-.31-.18-3.22.89.89-3.22-.18-.31C4.42 15.08 4 13.58 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z" />
                        </svg>
                    </div>
                    <span>BeyondChats</span>
                </Link>
            </header>

            {/* Hero */}
            <section className="hero">
                <h1>BeyondChats Blog</h1>
                <p>Explore Insights On AI Chatbot Innovations</p>
                <div className="search-container">
                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="Search articles..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowSuggestions(e.target.value.length > 0);
                            }}
                            onFocus={() => setShowSuggestions(searchQuery.length > 0)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        />
                        <button>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                            </svg>
                        </button>
                    </div>

                    {/* Autocomplete Suggestions */}
                    {showSuggestions && searchQuery && (
                        <div className="search-suggestions">
                            {articles
                                .filter(a =>
                                    a.title?.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .slice(0, 6)
                                .map(article => (
                                    <Link
                                        key={article.id}
                                        to={`/article/${article.id}`}
                                        className="suggestion-item"
                                        onClick={() => setShowSuggestions(false)}
                                    >
                                        {article.title}
                                    </Link>
                                ))
                            }
                            {articles.filter(a =>
                                a.title?.toLowerCase().includes(searchQuery.toLowerCase())
                            ).length === 0 && (
                                    <div className="no-suggestions">No articles found</div>
                                )}
                        </div>
                    )}
                </div>
            </section>

            {/* Status Filters */}
            <div className="filter-bar">
                <button className={filter === 'updated' ? 'active' : ''} onClick={() => setFilter('updated')}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                        <path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z" />
                    </svg>
                    Enhanced ({updatedCount})
                </button>
                <button className={filter === 'original' ? 'active' : ''} onClick={() => setFilter('original')}>
                    Original ({originalCount})
                </button>
            </div>

            {/* Main Content */}
            <main className="main-content full-width">
                {/* Popular Topics - Horizontal Scroll */}
                <div className="topics-bar">
                    {['AI Chatbots', 'Customer Support', 'Lead Generation', 'Healthcare', 'Small Business', 'SEO', 'Virtual Assistants', 'E-commerce', 'Conversational AI', 'Customer Experience'].map(topic => (
                        <button
                            key={topic}
                            className={`topic-tag ${topicFilter === topic ? 'active' : ''}`}
                            onClick={() => {
                                if (topicFilter === topic) {
                                    setTopicFilter('');
                                } else {
                                    setTopicFilter(topic);
                                }
                            }}
                        >
                            # {topic}
                        </button>
                    ))}
                </div>

                <div className="articles-list">
                    {loading ? (
                        <div className="loading">
                            <div className="spinner"></div>
                            <p>Loading articles...</p>
                        </div>
                    ) : paginatedArticles.length > 0 ? (
                        <>
                            {paginatedArticles.map(article => (
                                <ArticleCard key={article.id} article={article} />
                            ))}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="pagination">
                                    <button
                                        className="page-btn prev"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        ← PREV
                                    </button>

                                    <div className="page-numbers">
                                        {getPageNumbers().map((page, index) => (
                                            page === '...' ? (
                                                <span key={`ellipsis-${index}`} className="ellipsis">...</span>
                                            ) : (
                                                <button
                                                    key={page}
                                                    className={`page-num ${currentPage === page ? 'active' : ''}`}
                                                    onClick={() => setCurrentPage(page)}
                                                >
                                                    {page}
                                                </button>
                                            )
                                        ))}
                                    </div>

                                    <button
                                        className="page-btn next"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        NEXT →
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="no-articles">
                            <p>No articles found{searchQuery && ` for "${searchQuery}"`}.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
}
