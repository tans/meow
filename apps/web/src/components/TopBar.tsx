import type { ReactNode } from "react";

interface TopBarProps {
  title: string;
  onBack?: () => void;
  actions?: ReactNode;
}

export function TopBar({ title, onBack, actions }: TopBarProps) {
  return (
    <header className="top-bar">
      {onBack ? (
        <button
          className="top-bar__back"
          type="button"
          aria-label="返回"
          onClick={onBack}
        >
          返回
        </button>
      ) : null}
      <h1 className="top-bar__title">{title}</h1>
      {actions}
    </header>
  );
}
