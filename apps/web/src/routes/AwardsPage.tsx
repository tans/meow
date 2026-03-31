import { useState } from "react";
import { buildAwardsModel } from "../lib/models.js";

export function AwardsPage() {
  const [activePeriod, setActivePeriod] = useState("本周");
  const [activeCategory, setActiveCategory] = useState("全部");
  const model = buildAwardsModel(activePeriod, activeCategory);

  return (
    <section className="content-section">
      <div className="section-header">
        <div>
          <h1 className="section-title">{model.title}</h1>
          <p className="section-copy">{model.featuredDescription}</p>
        </div>
      </div>
      <div className="shell-nav" aria-label="时间筛选">
        {model.periods.map((period) => (
          <button
            key={period.value}
            className={period.active ? "primary-button" : "secondary-button"}
            type="button"
            onClick={() => setActivePeriod(period.value)}
          >
            {period.label}
          </button>
        ))}
      </div>
      <div className="shell-nav" aria-label="分类筛选">
        {model.categories.map((category) => (
          <button
            key={category.value}
            className={category.active ? "primary-button" : "secondary-button"}
            type="button"
            onClick={() => setActiveCategory(category.value)}
          >
            {category.label}
          </button>
        ))}
      </div>
      <div className="task-grid">
        {model.featuredCards.map((card) => (
          <article key={card.id} className="task-card">
            <span className="meta-pill">{card.badge}</span>
            <h2 className="task-title">{card.title}</h2>
            <p className="task-meta">{card.creatorName}</p>
            <p className="task-meta">{card.taskName}</p>
            <p className="task-detail">{card.resultText}</p>
            <button className="secondary-button" type="button">
              {card.actionText}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
