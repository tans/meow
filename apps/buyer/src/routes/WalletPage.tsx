type BuyerWallet = {
  escrowAmount: number;
  refundableAmount: number;
  tipSpentAmount: number;
  publishedTaskCount: number;
};

export function WalletPage({ wallet }: { wallet: BuyerWallet | null }) {
  if (!wallet) {
    return (
      <section className="panel stack">
        <div className="section-heading">
          <div>
            <p className="card-kicker">资金中心</p>
            <h3>加载中...</h3>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page-grid">
      <div className="metric-grid">
        <article className="panel metric-card">
          <p className="card-kicker">托管金额</p>
          <strong>¥{wallet.escrowAmount}</strong>
          <span>已冻结待结算</span>
        </article>
        <article className="panel metric-card">
          <p className="card-kicker">可退款金额</p>
          <strong>¥{wallet.refundableAmount}</strong>
          <span>结算后可退回商家余额</span>
        </article>
        <article className="panel metric-card">
          <p className="card-kicker">已打赏金额</p>
          <strong>¥{wallet.tipSpentAmount}</strong>
          <span>已进入创作者冻结收益</span>
        </article>
        <article className="panel metric-card">
          <p className="card-kicker">发布中任务</p>
          <strong>{wallet.publishedTaskCount}</strong>
          <span>持续接收投稿</span>
        </article>
      </div>
    </section>
  );
}
