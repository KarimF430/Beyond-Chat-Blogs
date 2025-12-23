import './GapAnalysis.css';

export default function GapAnalysis({ analysis }) {
    if (!analysis) return null;

    const score = analysis.score || 75;

    return (
        <div className="gap-analysis">
            <div className="score-section">
                <div className="score-circle" style={{ '--score': score }}>
                    <span>{score}</span>
                </div>
                <div className="score-label">
                    <h4>Content Score</h4>
                    <p>Based on AI analysis</p>
                </div>
            </div>

            {analysis.missing_topics?.length > 0 && (
                <div className="analysis-card missing">
                    <h4>
                        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                        </svg>
                        Missing Topics
                    </h4>
                    <ul>
                        {analysis.missing_topics.map((topic, i) => (
                            <li key={i}>{topic}</li>
                        ))}
                    </ul>
                </div>
            )}

            {analysis.improvements?.length > 0 && (
                <div className="analysis-card improvements">
                    <h4>
                        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                            <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
                        </svg>
                        Suggested Improvements
                    </h4>
                    <ul>
                        {analysis.improvements.map((item, i) => (
                            <li key={i}>{item}</li>
                        ))}
                    </ul>
                </div>
            )}

            {analysis.strengths?.length > 0 && (
                <div className="analysis-card strengths">
                    <h4>
                        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                        Strengths
                    </h4>
                    <ul>
                        {analysis.strengths.map((item, i) => (
                            <li key={i}>{item}</li>
                        ))}
                    </ul>
                </div>
            )}

            {analysis.recommendations?.length > 0 && (
                <div className="analysis-card recommendations">
                    <h4>
                        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                            <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z" />
                        </svg>
                        Recommendations
                    </h4>
                    <ul>
                        {analysis.recommendations.map((item, i) => (
                            <li key={i}>{item}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
