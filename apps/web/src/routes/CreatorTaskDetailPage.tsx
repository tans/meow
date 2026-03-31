import type {
  CreatorSubmissionCardModel,
  CreatorTaskDetailModel
} from "../lib/models.js";
import { TaskDetailPage } from "./TaskDetailPage.js";

interface CreatorTaskDetailPageProps {
  task: CreatorTaskDetailModel | null;
  submissionCards: CreatorSubmissionCardModel[];
  feedbackMessage?: string;
  errorMessage?: string;
  onSubmitTap: () => void;
  onEditTap: (submissionId: string) => void;
  onWithdrawTap: (submissionId: string) => void;
}

export function CreatorTaskDetailPage(props: CreatorTaskDetailPageProps) {
  return <TaskDetailPage {...props} />;
}
