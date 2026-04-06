import { ScrollArea } from "@/components/ui/scroll-area";
import type { PropsWithChildren, ReactNode } from "react";

interface MobileShellProps {
  header?: ReactNode;
  tabs?: ReactNode;
}

export function MobileShell({ header, tabs, children }: PropsWithChildren<MobileShellProps>) {
  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col bg-background">
      {header && <div className="sticky top-0 z-20 border-b border-border/40 bg-card/80 backdrop-blur-xl">{header}</div>}
      <ScrollArea className="flex-1 p-4 pb-0">
        <div className="max-w-2xl mx-auto">{children}</div>
      </ScrollArea>
      {tabs && <div className="sticky bottom-0 z-20 border-t border-border/40 mt-auto">{tabs}</div>}
    </div>
  );
}
