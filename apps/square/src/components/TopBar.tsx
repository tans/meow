import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

interface TopBarProps {
  title: string;
  onBack?: () => void;
  actions?: ReactNode;
}

export function TopBar({ title, onBack, actions }: TopBarProps) {
  return (
    <div className="flex h-14 items-center gap-3 px-4 bg-card/80 backdrop-blur-lg border-b border-border/40">
      {onBack ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 -ml-2"
          onClick={onBack}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span className="text-sm">返回</span>
        </Button>
      ) : (
        <div className="w-16" />
      )}
      <h1 className="flex-1 font-display text-base font-semibold text-foreground tracking-tight text-center pr-16">
        {title}
      </h1>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {actions}
      </div>
    </div>
  );
}
