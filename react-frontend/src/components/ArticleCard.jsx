import { Link } from 'react-router-dom';
import './ArticleCard.css';

export default function ArticleCard({ article }) {
    const date = new Date(article.created_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    }).toUpperCase();

    const isEnhanced = article.status === 'updated';

    return (
        <Link to={`/article/${article.id}`} className="article-card">
            {/* Image */}
            <div className="article-image">
                {article.featured_image ? (
                    <img src={article.featured_image} alt={article.title} />
                ) : (
                    <div className="image-placeholder">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5-7l-3 3.72L9 13l-3 4h12l-4-5z" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="article-content">
                {/* Category Tags */}
                <div className="article-tags">
                    <span className="category-tag"># AI CHATBOTS</span>
                    {isEnhanced && (
                        <span className="category-tag enhanced">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10" style={{ marginRight: '3px' }}>
                                <path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z" />
                            </svg>
                            ENHANCED
                        </span>
                    )}
                </div>

                {/* Title */}
                <h2 className="article-title">{article.title}</h2>

                {/* Meta */}
                <div className="article-meta">
                    <span className="author">SIMRAN JAIN</span>
                    <span className="separator">/</span>
                    <span className="date">{date}</span>
                </div>

                {/* Excerpt */}
                {article.excerpt && (
                    <p className="article-excerpt">{article.excerpt}</p>
                )}
            </div>
        </Link>
    );
}
