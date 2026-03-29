import type { CreatorTaskCardModel } from "../lib/models.js";
import { TaskCard } from "../components/TaskCard.js";

interface CreatorHomePageProps {
  tasks?: CreatorTaskCardModel[];
}

export function CreatorHomePage({ tasks = [] }: CreatorHomePageProps) {
  return (
    <section>
      <h2>悬赏大厅</h2>
      <p>按小程序节奏展示可参与任务，优先保证发现和投稿路径顺手。</p>
      {tasks.length > 0 ? (
        tasks.map((task) => (
          <TaskCard
            key={task.id}
            title={task.title}
            eyebrow={task.brandName}
            meta={task.budgetText}
            detail={task.deadlineText}
          />
        ))
      ) : (
        <p>暂无可参与任务，稍后再来刷新。</p>
      )}
    </section>
  );
}
