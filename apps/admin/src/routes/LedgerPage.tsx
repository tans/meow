import type { LedgerRow } from "../lib/api.js";

interface LedgerPageProps {
  entries?: LedgerRow[];
  onMarkAnomaly?: (entryId: string) => void;
  busyEntryId?: string | null;
}

export function LedgerPage({
  entries = [],
  onMarkAnomaly = () => undefined,
  busyEntryId = null
}: LedgerPageProps) {
  return (
    <section className="panel stack">
      <div className="section-heading">
        <div>
          <p className="card-kicker">资金管理</p>
          <h3>账本流水与退款进度</h3>
        </div>
      </div>
      {entries.length === 0 ? <p>暂无治理日志</p> : null}
      {entries.map((entry) => (
        <article key={entry.id} className="list-row">
          <div>
            <strong>{entry.action}</strong>
            <p>
              {entry.account} · {entry.status}
            </p>
          </div>
          <div className="task-actions">
            <span className="amount-pill">{entry.amount}</span>
            <button
              type="button"
              className="ghost-button"
              disabled={busyEntryId === entry.id}
              onClick={() => onMarkAnomaly(entry.id)}
            >
              标记异常
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}
