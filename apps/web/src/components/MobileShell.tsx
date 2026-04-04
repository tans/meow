import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PropsWithChildren, ReactNode } from "react";

interface MobileShellProps {
  header?: ReactNode;
  tabs?: ReactNode;
}

export function MobileShell({ header, tabs, children }: PropsWithChildren<MobileShellProps>) {
  return (
    <div className="grid min-h-screen place-items-center p-3">
      <Card className="grid w-full max-w-[430px] min-h-[calc(100vh-24px)] grid-rows-[auto_1fr_auto] overflow-hidden border-[rgba(55,111,199,0.16)] bg-gradient-to-b from-white/95 to-[rgba(241,247,255,0.98)] shadow-[0_34px_90px_rgba(35,77,141,0.18)]">
        {header ? (
          <div className="px-3 pt-3 bg-gradient-to-b from-[rgba(242,248,255,0.96)] to-[rgba(242,248,255,0.72)]">
            {header}
          </div>
        ) : null}
        <ScrollArea className="px-3 py-4 bg-[radial-gradient(circle_at_top_center,rgba(217,234,255,0.6),transparent_26%),linear-gradient(180deg,#f5f9ff_0%,#edf5ff_100%)]">
          {children}
        </ScrollArea>
        {tabs ? (
          <div className="px-3 pb-3 bg-gradient-to-b from-transparent to-[rgba(242,248,255,0.92)]">
            {tabs}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
