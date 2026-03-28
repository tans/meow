import { dashboardPreview } from "../lib/api.js";

interface DashboardPageProps {
  data?: typeof dashboardPreview;
}

export function DashboardPage({ data = dashboardPreview }: DashboardPageProps) {
  return (
    <section className="page-grid">
      <div className="hero-card">
        <p className="card-kicker">运营看板</p>
        <h3>{data.title}</h3>
        <p>{data.summary}</p>
      </div>

      <div className="metric-grid">
        {data.metrics.map((metric) => (
          <article key={metric.label} className="panel metric-card">
            <p className="card-kicker">{metric.label}</p>
            <strong>{metric.value}</strong>
            <span>{metric.trend}</span>
          </article>
        ))}
      </div>

      <div className="panel stack">
        <h3>运营提醒</h3>
        {data.alerts.map((alert) => (
          <article key={alert.title} className="list-row">
            <div>
              <strong>{alert.title}</strong>
              <p>{alert.detail}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
