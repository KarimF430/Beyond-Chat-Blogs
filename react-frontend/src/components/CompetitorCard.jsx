import './CompetitorCard.css';

export default function CompetitorCard({ competitor, index }) {
    return (
        <div className="competitor-card">
            <div className="card-number">{index}</div>
            <h4>{competitor.title}</h4>
            {competitor.content_summary && (
                <p className="summary">{competitor.content_summary}</p>
            )}
            <a
                href={competitor.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="source-link"
            >
                View Source →
            </a>
        </div>
    );
}
