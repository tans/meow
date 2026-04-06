import { useState } from "react";
import { buildAwardsModel } from "../lib/models.js";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AwardsPage() {
  const [activePeriod, setActivePeriod] = useState("本周");
  const [activeCategory, setActiveCategory] = useState("全部");
  const model = buildAwardsModel(activePeriod, activeCategory);

  return (
    <section className="space-y-5 pb-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-warning/90 via-warning to-accent/80 p-6 text-white shadow-lg shadow-warning/20 animate-fade-in-up opacity-0">
        <div className="relative z-10">
          <h1 className="font-display text-2xl font-bold tracking-tight">{model.title}</h1>
          <p className="mt-1.5 text-sm text-white/80 leading-relaxed">{model.featuredDescription}</p>
        </div>
        {/* Decorative */}
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-accent/30 rounded-full blur-xl" />
      </div>

      {/* Period Filter */}
      <div className="flex gap-2.5 overflow-x-auto pb-2 px-1 -mx-1" aria-label="时间筛选">
        {model.periods.map((period, index) => (
          <button
            key={period.value}
            className={`
              inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap
              transition-all duration-200 cursor-pointer animate-fade-in-up opacity-0
              ${period.active
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 -translate-y-0.5"
                : "bg-card border border-border/60 text-muted-foreground hover:border-primary/30 hover:text-foreground hover:-translate-y-0.5"
              }
            `}
            style={{ animationDelay: `${index * 50}ms` }}
            type="button"
            onClick={() => setActivePeriod(period.value)}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 px-1 -mx-1" aria-label="分类筛选">
        {model.categories.map((category, index) => (
          <button
            key={category.value}
            className={`
              inline-flex items-center rounded-full px-4 py-2 text-xs font-medium whitespace-nowrap
              transition-all duration-200 cursor-pointer animate-fade-in-up opacity-0
              ${category.active
                ? "bg-accent text-accent-foreground shadow-md shadow-accent/25"
                : "bg-card border border-border/60 text-muted-foreground hover:border-accent/30 hover:text-foreground"
              }
            `}
            style={{ animationDelay: `${(index + 4) * 50}ms` }}
            type="button"
            onClick={() => setActiveCategory(category.value)}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Featured Cards */}
      <div className="space-y-4">
        {model.featuredCards.map((card, index) => (
          <Card
            key={card.id}
            className="border-border/60 bg-card/80 backdrop-blur-sm card-hover animate-fade-in-up opacity-0"
            style={{ animationDelay: `${(index + 7) * 80}ms` }}
          >
            <CardContent className="p-5">
              <Badge variant="warning" className="bg-warning/10 text-warning border-warning/20 text-xs font-semibold mb-3">
                {card.badge}
              </Badge>
              <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
                {card.title}
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{card.creatorName}</p>
              <p className="text-sm text-muted-foreground">{card.taskName}</p>
              <p className="mt-2 text-sm font-medium text-foreground/80">{card.resultText}</p>
              <button
                className="mt-4 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground shadow-md shadow-accent/20 hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/30 transition-all duration-200 active:scale-[0.97]"
                type="button"
              >
                {card.actionText}
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
