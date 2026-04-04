import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ReactNode } from "react";

interface TopBarProps {
  title: string;
  onBack?: () => void;
  actions?: ReactNode;
}

export function TopBar({ title, onBack, actions }: TopBarProps) {
  return (
    <Card className="grid min-h-16 grid-cols-[auto_1fr_auto] items-center gap-2 border-[rgba(84,137,214,0.14)] bg-white/80 p-3 shadow-[0_12px_30px_rgba(48,98,176,0.12)] backdrop-blur-[16px]">
      {onBack ? (
        <Button
          variant="outline"
          size="sm"
          className="h-9 rounded-full border-[rgba(55,111,199,0.16)] bg-[#f5f9ff] text-[#1f64d1] text-sm"
          onClick={onBack}
        >
          返回
        </Button>
      ) : (
        <div />
      )}
      <h1 className="text-lg font-medium tracking-tight text-[#183153]">{title}</h1>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {actions}
      </div>
    </Card>
  );
}
