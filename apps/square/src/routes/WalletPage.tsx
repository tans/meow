import type { WalletMetricModel } from "../lib/models.js";
import { Card, CardContent } from "@/components/ui/card";

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
    <section className="space-y-5 pb-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-success/90 via-success to-success/80 p-6 text-white shadow-lg shadow-success/20 animate-fade-in-up opacity-0">
        <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1.5 text-sm text-white/80 leading-relaxed">{summary}</p>
      </div>

      {/* Metric Cards */}
      {cards.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {cards.map((item, index) => (
            <Card
              key={item.label}
              className="border-border/60 bg-card/80 backdrop-blur-sm animate-fade-in-up opacity-0"
              style={{ animationDelay: `${(index + 1) * 80}ms` }}
            >
              <CardContent className="p-4">
                <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                <p className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground">
                  {item.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : errorMessage ? (
        <div className="rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 p-6 text-center animate-fade-in">
          <p className="text-sm text-muted-foreground font-medium">{errorMessage}</p>
        </div>
      ) : null}
    </section>
  );
}
