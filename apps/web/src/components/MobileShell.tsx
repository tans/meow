import type { PropsWithChildren, ReactNode } from "react";

interface MobileShellProps {
  header?: ReactNode;
  tabs?: ReactNode;
}

export function MobileShell({
  header,
  tabs,
  children
}: PropsWithChildren<MobileShellProps>) {
  return (
    <div className="mobile-app">
      <div className="mobile-device">
        {header ? <div className="mobile-top">{header}</div> : null}
        <main className="mobile-content">{children}</main>
        {tabs ? <div className="mobile-bottom">{tabs}</div> : null}
      </div>
    </div>
  );
}
