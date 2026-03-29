import { TaskCard } from "../components/TaskCard.js";
import type { MerchantTaskCardModel } from "../lib/models.js";

interface MerchantTasksPageProps {
  tasks?: MerchantTaskCardModel[];
}

export function MerchantTasksPage({ tasks = [] }: MerchantTasksPageProps) {
  return (
    <section>
      <h2>任务管理</h2>
      <p>用桌面端密度承接小程序里的发单、审稿、结算节奏。</p>
      {tasks.length > 0 ? (
        tasks.map((task) => (
          <TaskCard
            key={task.id}
            title={task.title}
            eyebrow={task.statusText}
            meta={`${task.submissionCount} 件投稿`}
            detail="继续推进审核与结算节奏"
          />
        ))
      ) : (
        <p>暂无任务，先创建第一条悬赏。</p>
      )}
    </section>
  );
}
