import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ReactNode } from "react";

interface TaskCardProps {
  title: string;
  eyebrow: string;
  meta: string;
  detail: string;
  footer?: ReactNode;
}

export function TaskCard({ title, eyebrow, meta, detail, footer }: TaskCardProps) {
  return (
    <Card className="card-hover border-border/60 bg-card/80 backdrop-blur-sm animate-fade-in-up opacity-0">
      <CardHeader className="pb-3">
        <Badge
          variant="secondary"
          className="w-fit bg-primary/8 text-primary border-primary/20 text-xs font-semibold tracking-wide uppercase px-2.5"
        >
          {eyebrow}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-2.5">
        <h3 className="font-display text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="text-sm font-semibold text-primary/90">{meta}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">{detail}</p>
      </CardContent>

      {footer ? (
        <CardFooter className="border-t border-border/40 pt-4">{footer}</CardFooter>
      ) : null}
    </Card>
  );
}
