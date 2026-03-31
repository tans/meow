import type { WalletMetricModel } from "../lib/models.js";

interface WalletPageProps {
  title: string;
  summary: string;
  cards: WalletMetricModel[];
  errorMessage?: string;
}

export function WalletPage({
  title,
  summary,
  cards,
  errorMessage
}: WalletPageProps) {
  return (
    <section className="content-section">
      <div className="section-header">
        <div>
          <h1 className="section-title">{title}</h1>
          <p className="section-copy">{summary}</p>
        </div>
      </div>
      {cards.length > 0 ? (
        <div className="task-grid">
          {cards.map((item) => (
            <article key={item.label} className="task-card">
              <h2 className="task-title">{item.label}</h2>
              <p className="task-meta">{item.value}</p>
            </article>
          ))}
        </div>
      ) : errorMessage ? (
        <p className="empty-state">{errorMessage}</p>
      ) : null}
    </section>
  );
}
