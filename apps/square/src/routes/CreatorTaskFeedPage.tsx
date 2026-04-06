import type { CreatorSubmissionCardModel } from "../lib/models.js";

interface CreatorTaskFeedPageProps {
  cards: CreatorSubmissionCardModel[];
  errorMessage?: string;
  onTaskTap: (taskId: string) => void;
}

export function CreatorTaskFeedPage({
  cards,
  errorMessage,
  onTaskTap
}: CreatorTaskFeedPageProps) {
  return (
    <section className="space-y-4">
      <div className="rounded-lg bg-white p-5 shadow-sm border border-gray-200">
        <h1 className="text-2xl font-medium text-gray-900">我的投稿</h1>
        <p className="mt-1 text-sm text-gray-500">原生创作者页：查看所有投稿记录与状态。</p>
      </div>
      {cards.length > 0 ? (
        <div className="space-y-3">
          {cards.map((item) => (
            <article key={item.submissionId} className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">{item.title}</h2>
              <p className="text-sm text-gray-500">状态：{item.statusText}</p>
              <p className="text-sm text-gray-400">奖励：{item.rewardTag}</p>
              <button
                className="mt-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700"
                type="button"
                onClick={() => onTaskTap(item.taskId)}
              >
                查看任务
              </button>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-500">
          {errorMessage ?? "还没有投稿记录"}
        </p>
      )}
    </section>
  );
}
