import { useEffect, useState } from "react";
import { listCreatorSubmissions } from "../lib/api.js";
import {
  mapCreatorSubmissionCard,
  type CreatorSubmissionCardModel
} from "../lib/models.js";
import { CreatorTaskFeedPage } from "./CreatorTaskFeedPage.js";

export function CreatorTaskFeedRoute({
  onTaskTap
}: {
  onTaskTap: (taskId: string) => void;
}) {
  const [cards, setCards] = useState<CreatorSubmissionCardModel[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const submissions = await listCreatorSubmissions();

        if (cancelled) {
          return;
        }

        setCards(submissions.map(mapCreatorSubmissionCard));
        setErrorMessage(undefined);
      } catch {
        if (!cancelled) {
          setCards([]);
          setErrorMessage("我的投稿加载失败");
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <CreatorTaskFeedPage
      cards={cards}
      errorMessage={errorMessage}
      onTaskTap={onTaskTap}
    />
  );
}
