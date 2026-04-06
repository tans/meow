import type { WalletMetricModel } from "../lib/models.js";
import { WalletPage } from "./WalletPage.js";

interface CreatorEarningsPageProps {
  cards: WalletMetricModel[];
  errorMessage?: string;
}

export function CreatorEarningsPage({
  cards,
  errorMessage
}: CreatorEarningsPageProps) {
  return (
    <WalletPage
      title="收益明细"
      summary="查看冻结收益、可提现金额和累计投稿。"
      cards={cards}
      errorMessage={errorMessage}
    />
  );
}
