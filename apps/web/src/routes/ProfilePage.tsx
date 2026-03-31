import { buildProfileModel } from "../lib/models.js";
import type { WebRole } from "../lib/session.js";

interface ProfilePageProps {
  currentRole: WebRole;
  onQuickLinkTap?: (path: string) => void;
  onEnterMerchant: () => void;
}

export function ProfilePage({
  currentRole,
  onQuickLinkTap,
  onEnterMerchant
}: ProfilePageProps) {
  const model = buildProfileModel();

  return (
    <section className="content-section content-section--profile">
      <div className="section-header section-header--hero">
        <div>
          <h1 className="section-title">{model.title}</h1>
          <p className="section-copy">{model.creatorStatus}</p>
        </div>
      </div>
      <article className="task-card profile-hero-card">
        <h2 className="task-title">{model.creatorName}</h2>
        <p className="task-meta">{model.creatorBio}</p>
        <p className="task-detail">{model.creatorTags.join(" / ")}</p>
      </article>
      <div className="task-grid task-grid--stats">
        {model.stats.map((stat) => (
          <article key={stat.label} className="task-card">
            <h2 className="task-title">{stat.value}</h2>
            <p className="task-meta">{stat.label}</p>
          </article>
        ))}
      </div>
      <div className="task-grid task-grid--links">
        {model.quickLinks.map((item) => (
          <button
            key={item.path}
            className="task-card quick-link-card"
            type="button"
            onClick={() => onQuickLinkTap?.(item.path)}
          >
            <h2 className="task-title">{item.title}</h2>
            <p className="task-meta">查看</p>
          </button>
        ))}
      </div>
      <article className="task-card merchant-entry-card">
        <h2 className="task-title">{model.merchantEntry.title}</h2>
        <p className="task-meta">{model.merchantEntry.description}</p>
        <button
          className="primary-button"
          type="button"
          onClick={onEnterMerchant}
          disabled={currentRole === "merchant"}
        >
          {model.merchantEntry.actionText}
        </button>
      </article>
    </section>
  );
}
