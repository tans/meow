import { ledgerPreview, type LedgerRow } from "../lib/api.js";

interface LedgerPageProps {
  entries?: LedgerRow[];
}

export function LedgerPage({ entries = ledgerPreview }: LedgerPageProps) {
  return (
    <section className="panel stack">
      <div className="section-heading">
        <div>
          <p className="card-kicker">资金管理</p>
          <h3>账本流水与退款进度</h3>
        </div>
      </div>
      {entries.map((entry) => (
        <article key={entry.id} className="list-row">
          <div>
            <strong>{entry.action}</strong>
            <p>
              {entry.account} · {entry.status}
            </p>
          </div>
          <span className="amount-pill">{entry.amount}</span>
        </article>
      ))}
    </section>
  );
}
