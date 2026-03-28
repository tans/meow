interface HeaderProps {
  title: string;
  subtitle: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="header">
      <div>
        <p className="header-kicker">Operator Console</p>
        <h2>{title}</h2>
        <p className="header-subtitle">{subtitle}</p>
      </div>
      <div className="header-actions">
        <div className="header-chip">轻审核开启</div>
        <div className="header-chip accent">账本模拟模式</div>
      </div>
    </header>
  );
}
