import { useEffect, useState } from "react";
import { getCreatorWallet } from "../lib/api.js";
import { mapCreatorWalletMetrics, type WalletMetricModel } from "../lib/models.js";

interface UseCreatorWalletMetricsResult {
  cards: WalletMetricModel[];
  errorMessage?: string;
}

export function useCreatorWalletMetrics(): UseCreatorWalletMetricsResult {
  const [cards, setCards] = useState<WalletMetricModel[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const snapshot = await getCreatorWallet();

        if (cancelled) {
          return;
        }

        setCards(mapCreatorWalletMetrics(snapshot));
        setErrorMessage(undefined);
      } catch {
        if (!cancelled) {
          setCards([]);
          setErrorMessage("收益明细加载失败");
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    cards,
    errorMessage
  };
}
