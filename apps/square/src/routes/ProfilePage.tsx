import { buildProfileModel } from "../lib/models.js";
import type { WebRole } from "../lib/session.js";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    <section className="space-y-5 pb-6">
      {/* Header */}
      <div className="rounded-2xl bg-card p-5 shadow-sm border border-border/60 animate-fade-in-up opacity-0">
        <Badge variant="secondary" className="bg-primary/8 text-primary border-primary/20 text-xs font-semibold mb-2">
          {currentRole === "creator" ? "创作者" : "需求方"}
        </Badge>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          {model.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{model.creatorStatus}</p>
      </div>

      {/* Creator Info */}
      <Card className="border-border/60 bg-card/80 backdrop-blur-sm animate-fade-in-up opacity-0 stagger-1">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg shadow-md">
              {model.creatorName.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
                {model.creatorName}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {model.creatorBio}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {model.creatorTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-muted/80 px-2.5 py-0.5 text-xs font-medium text-foreground/80"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {model.stats.map((stat, index) => (
          <Card
            key={stat.label}
            className="border-border/60 bg-card/80 backdrop-blur-sm animate-fade-in-up opacity-0"
            style={{ animationDelay: `${(index + 2) * 80}ms` }}
          >
            <CardContent className="p-4 text-center">
              <p className="font-display text-3xl font-bold tracking-tight text-foreground">
                {stat.value}
              </p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <div className="space-y-2">
        {model.quickLinks.map((item, index) => (
          <button
            key={item.path}
            className="flex w-full items-center justify-between rounded-xl bg-card/80 backdrop-blur-sm p-4 text-left shadow-sm border border-border/60 hover:border-primary/30 hover:bg-card transition-all duration-200 animate-fade-in-up opacity-0"
            style={{ animationDelay: `${(index + 4) * 60}ms` }}
            type="button"
            onClick={() => onQuickLinkTap?.(item.path)}
          >
            <h2 className="font-medium text-foreground">{item.title}</h2>
            <svg className="w-5 h-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        ))}
      </div>

      {/* Merchant Entry */}
      <Card className="border-accent/30 bg-accent/5 animate-fade-in-up opacity-0 stagger-6">
        <CardContent className="p-5">
          <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
            {model.merchantEntry.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            {model.merchantEntry.description}
          </p>
          <button
            className={`
              mt-4 rounded-full px-5 py-2.5 text-sm font-semibold shadow-md transition-all duration-200 active:scale-[0.97]
              ${currentRole === "merchant"
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-accent text-accent-foreground shadow-accent/20 hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/30"
              }
            `}
            type="button"
            onClick={onEnterMerchant}
            disabled={currentRole === "merchant"}
          >
            {model.merchantEntry.actionText}
          </button>
        </CardContent>
      </Card>
    </section>
  );
}
