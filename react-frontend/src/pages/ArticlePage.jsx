import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { getArticle, getCompetitors } from '../services/api';
import GapAnalysis from '../components/GapAnalysis';
import CompetitorCard from '../components/CompetitorCard';
import Footer from '../components/Footer';
import './ArticlePage.css';

// Helper function to extract domain from URL
function getDomain(url) {
    if (!url) return 'unknown source';
    try {
        const domain = new URL(url).hostname.replace('www.', '');
        return domain;
    } catch {
        return 'unknown source';
    }
}

export default function ArticlePage() {
    const { id } = useParams();
    const [article, setArticle] = useState(null);
    const [competitors, setCompetitors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAnalysis, setShowAnalysis] = useState(true);
    const [liked, setLiked] = useState(false);

    // Comments state - load from localStorage
    const defaultComments = [
        {
            id: 1,
            author: 'Siddhant',
            avatar: 'S',
            date: 'APRIL 10, 2025 / 4:03 AM',
            text: 'Marketing spends need to be better managed!!!',
            replies: []
        }
    ];

    const [comments, setComments] = useState(() => {
        const saved = localStorage.getItem(`comments-${id}`);
        return saved ? JSON.parse(saved) : defaultComments;
    });
    const [commentForm, setCommentForm] = useState({ name: '', email: '', website: '', comment: '' });
    const [replyingTo, setReplyingTo] = useState(null);
    const [saveInfo, setSaveInfo] = useState(false);

    // Save comments to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem(`comments-${id}`, JSON.stringify(comments));
    }, [comments, id]);

    // Delete comment function
    const deleteComment = (commentId) => {
        setComments(comments.filter(c => c.id !== commentId));
    };

    // Delete reply function
    const deleteReply = (commentId, replyId) => {
        setComments(comments.map(c =>
            c.id === commentId
                ? { ...c, replies: c.replies.filter(r => r.id !== replyId) }
                : c
        ));
    };

    useEffect(() => {
        fetchArticle();
    }, [id]);

    async function fetchArticle() {
        try {
            setLoading(true);
            const data = await getArticle(id);
            setArticle(data);

            if (data.status === 'updated' && data.competitor_articles?.length > 0) {
                setCompetitors(data.competitor_articles);
            } else {
                const comp = await getCompetitors(id);
                setCompetitors(comp);
            }
        } catch (error) {
            console.error('Failed to fetch article:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="article-page loading">
                <div className="spinner"></div>
                <p>Loading article...</p>
            </div>
        );
    }

    if (!article) {
        return (
            <div className="article-page error">
                <h2>Article not found</h2>
                <Link to="/">← Back to Home</Link>
            </div>
        );
    }

    const isEnhanced = article.status === 'updated';

    // Remove the embedded references section from content if it exists
    // This serves the user request to "remove from above"
    const contentWithoutReferences = article.content?.replace(/<section class="related-articles-section"[\s\S]*?<\/section>/gi, '') || '';

    // Use real author from API, fallback to BeyondChats Team
    const author = article.author || 'BeyondChats Team';

    // Use published_at for display (actual publication date), fallback to created_at
    const displayDate = article.published_at || article.created_at;
    const date = new Date(displayDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    }).toUpperCase();

    return (
        <div className="article-page">
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

                <nav className="nav-links">
                    {/* Navigation removed as per request */}
                </nav>
            </header>

            <div className="article-container">
                {/* Breadcrumb */}
                <nav className="breadcrumb">
                    <Link to="/">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back to Articles
                    </Link>
                </nav>

                {/* Article Content */}
                <article className="article-content">
                    <header className="article-header">
                        <h1>{article.title}</h1>
                        <div className="article-meta">
                            <span className="author-name">{author.toUpperCase()}</span>
                            <span className="meta-separator">•</span>
                            <span className="article-date">{date}</span>
                            <span className="meta-separator">•</span>
                            <span className="article-categories">
                                <a href="#"># CHATBOTS</a>, <a href="#">VIRTUAL ASSISTANTS</a>
                            </span>
                        </div>
                    </header>

                    {/* Social Share Row */}
                    <div className="social-share-row">
                        <div className="engagement-stats">
                            <button className={`stat-item like-btn ${liked ? 'liked' : ''}`} onClick={() => setLiked(!liked)}>
                                <svg viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                    <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                </svg>
                                <span>{liked ? 1 : 0}</span>
                            </button>
                            <button className="stat-item" onClick={() => document.getElementById('comments-section').scrollIntoView({ behavior: 'smooth' })} title="Jump to comments">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
                                </svg>
                                <span>{comments.length}</span>
                            </button>
                        </div>
                        <div className="social-icons">
                            <button className="social-icon" title="Facebook">
                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                            </button>
                            <button className="social-icon" title="Twitter">
                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                            </button>
                            <button className="social-icon" title="LinkedIn">
                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                            </button>
                            <button className="social-icon hide-mobile" title="WhatsApp">
                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                            </button>
                            <button className="social-icon hide-mobile" title="Email">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Article Body - Sanitized for Security */}
                    <div className="article-body" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contentWithoutReferences) }} />
                </article>

                {/* Gap Analysis Panel - Removed as per request */}

                {/* Competitor Articles Section - Removed as per request */}
                {/* References - Removed as per request */}

                {/* Comments Section */}
                <section id="comments-section" className="comments-section">
                    <h2>{comments.length} comment{comments.length !== 1 ? 's' : ''}</h2>

                    <div className="comments-list">
                        {comments.map((comment) => (
                            <div key={comment.id} className="comment">
                                <div className="comment-avatar">{comment.avatar}</div>
                                <div className="comment-content">
                                    <div className="comment-header">
                                        <span className="comment-author">{comment.author}</span>
                                        <span className="comment-meta">{comment.date}</span>
                                        <div className="comment-actions">
                                            <button
                                                className="comment-reply-btn"
                                                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                            >
                                                {replyingTo === comment.id ? 'CANCEL' : 'REPLY'}
                                            </button>
                                            <button
                                                className="comment-delete-btn"
                                                onClick={() => deleteComment(comment.id)}
                                                title="Delete comment"
                                            >
                                                DELETE
                                            </button>
                                        </div>
                                    </div>
                                    <p className="comment-text">{comment.text}</p>

                                    {/* Reply Form */}
                                    {replyingTo === comment.id && (
                                        <div className="reply-inline-form">
                                            <textarea
                                                placeholder={`Reply to ${comment.author}...`}
                                                rows="3"
                                                value={commentForm.comment}
                                                onChange={(e) => setCommentForm({ ...commentForm, comment: e.target.value })}
                                            />
                                            <button
                                                className="submit-reply-btn"
                                                onClick={() => {
                                                    if (commentForm.comment.trim()) {
                                                        const newReply = {
                                                            id: Date.now(),
                                                            author: commentForm.name || 'Anonymous',
                                                            avatar: (commentForm.name || 'A')[0].toUpperCase(),
                                                            date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase() + ' / ' + new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
                                                            text: commentForm.comment
                                                        };
                                                        setComments(comments.map(c =>
                                                            c.id === comment.id
                                                                ? { ...c, replies: [...(c.replies || []), newReply] }
                                                                : c
                                                        ));
                                                        setCommentForm({ ...commentForm, comment: '' });
                                                        setReplyingTo(null);
                                                    }
                                                }}
                                            >
                                                Post Reply
                                            </button>
                                        </div>
                                    )}

                                    {comment.replies?.map((reply) => (
                                        <div key={reply.id} className="comment reply">
                                            <div className="comment-avatar small">{reply.avatar}</div>
                                            <div className="comment-content">
                                                <div className="comment-header">
                                                    <span className="comment-author">{reply.author}</span>
                                                    <span className="comment-meta">{reply.date}</span>
                                                    <button
                                                        className="comment-delete-btn"
                                                        onClick={() => deleteReply(comment.id, reply.id)}
                                                        title="Delete reply"
                                                    >
                                                        DELETE
                                                    </button>
                                                </div>
                                                <p className="comment-text">{reply.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Leave a Reply Form */}
                    <div className="reply-form">
                        <h3>Leave a Reply</h3>
                        <p className="form-note">Your email address will not be published. Required fields are marked <span className="required">*</span></p>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            if (commentForm.name && commentForm.email && commentForm.comment) {
                                const newComment = {
                                    id: Date.now(),
                                    author: commentForm.name,
                                    avatar: commentForm.name[0].toUpperCase(),
                                    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase() + ' / ' + new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
                                    text: commentForm.comment,
                                    replies: []
                                };
                                setComments([...comments, newComment]);
                                if (!saveInfo) {
                                    setCommentForm({ name: '', email: '', website: '', comment: '' });
                                } else {
                                    setCommentForm({ ...commentForm, comment: '' });
                                }
                            }
                        }}>
                            <div className="form-row">
                                <div className="form-group">
                                    <input
                                        type="text"
                                        placeholder="Name"
                                        required
                                        value={commentForm.name}
                                        onChange={(e) => setCommentForm({ ...commentForm, name: e.target.value })}
                                    />
                                    <span className="required">*</span>
                                </div>
                                <div className="form-group">
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        required
                                        value={commentForm.email}
                                        onChange={(e) => setCommentForm({ ...commentForm, email: e.target.value })}
                                    />
                                    <span className="required">*</span>
                                </div>
                                <div className="form-group">
                                    <input
                                        type="url"
                                        placeholder="Website"
                                        value={commentForm.website}
                                        onChange={(e) => setCommentForm({ ...commentForm, website: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group textarea-group">
                                <textarea
                                    placeholder="Add Comment"
                                    rows="6"
                                    required
                                    value={commentForm.comment}
                                    onChange={(e) => setCommentForm({ ...commentForm, comment: e.target.value })}
                                />
                                <span className="required">*</span>
                            </div>

                            <div className="form-checkbox">
                                <input
                                    type="checkbox"
                                    id="save-info"
                                    checked={saveInfo}
                                    onChange={(e) => setSaveInfo(e.target.checked)}
                                />
                                <label htmlFor="save-info">Save my name, email and website in this browser for the next time I comment.</label>
                            </div>

                            <button type="submit" className="submit-btn">Post Comment</button>
                        </form>
                    </div>
                </section>

                {/* Reference Articles */}
                <section className="related-articles-section">
                    <h2>Reference Articles</h2>
                    <p className="section-subtitle">These articles were analyzed by our AI to enhance the content above</p>

                    <div className="related-articles-grid">
                        {competitors.length > 0 ? (
                            competitors.slice(0, 4).map((comp, i) => (
                                <a
                                    key={i}
                                    className="related-article-card"
                                    href={comp.source_url || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <div className="related-image">
                                        {comp.image_url ? (
                                            <>
                                                <img
                                                    src={comp.image_url}
                                                    alt={comp.title}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                                <div className="related-image-placeholder" style={{ display: 'none' }}>
                                                    {comp.title?.substring(0, 40) || `Reference Article ${i + 1}`}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="related-image-placeholder">
                                                {comp.title?.substring(0, 40) || `Reference Article ${i + 1}`}
                                            </div>
                                        )}
                                    </div>
                                    <h3>{comp.title || `Reference Article ${i + 1}`}</h3>
                                    <p className="related-meta">Source: {getDomain(comp.source_url)}</p>
                                    <p className="related-excerpt">
                                        {comp.content_summary?.substring(0, 120) || 'This reference article was analyzed to enhance the original content with additional insights.'}...
                                    </p>
                                </a>
                            ))
                        ) : (
                            <>
                                <a className="related-article-card" href="https://beyondchats.com/blogs/" target="_blank" rel="noopener noreferrer">
                                    <div className="related-image">
                                        <div className="related-image-placeholder">Choosing the right AI chatbot</div>
                                    </div>
                                    <h3>Choosing the right AI chatbot : A Guide</h3>
                                    <p className="related-meta">Source: beyondchats.com</p>
                                    <p className="related-excerpt">If you've been looking for a chatbot lately, you've probably felt one thing – "confusion."</p>
                                </a>
                                <a className="related-article-card" href="https://beyondchats.com/blogs/" target="_blank" rel="noopener noreferrer">
                                    <div className="related-image">
                                        <div className="related-image-placeholder">Should you trust AI?</div>
                                    </div>
                                    <h3>Should you trust AI in healthcare?</h3>
                                    <p className="related-meta">Source: healthtech.com</p>
                                    <p className="related-excerpt">AI in healthcare has become one of the most debated shifts in modern medicine.</p>
                                </a>
                                <a className="related-article-card" href="https://beyondchats.com/blogs/" target="_blank" rel="noopener noreferrer">
                                    <div className="related-image">
                                        <div className="related-image-placeholder">Building AI Chatbot</div>
                                    </div>
                                    <h3>Why we are building yet another AI Chatbot</h3>
                                    <p className="related-meta">Source: techcrunch.com</p>
                                    <p className="related-excerpt">Your first thought might be "Not another AI chatbot startup please!"</p>
                                </a>
                                <a className="related-article-card" href="https://beyondchats.com/blogs/" target="_blank" rel="noopener noreferrer">
                                    <div className="related-image">
                                        <div className="related-image-placeholder">AI Patient Care</div>
                                    </div>
                                    <h3>Will AI Understand Patient Care?</h3>
                                    <p className="related-meta">Source: forbes.com</p>
                                    <p className="related-excerpt">Artificial intelligence is no longer futuristic—it's already here in healthcare.</p>
                                </a>
                            </>
                        )}
                    </div>

                    <button className="see-more-btn" onClick={() => window.open('https://beyondchats.com/blogs/', '_blank')}>
                        See more recommendations
                    </button>
                </section>
            </div>

            {/* Footer */}
            <Footer />
        </div>
    );
}
