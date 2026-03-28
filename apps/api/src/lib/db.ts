export interface DemoTaskRecord {
  id: string;
  merchantId: string;
  status: "draft" | "published";
}

const taskStore = new Map<string, DemoTaskRecord>([
  [
    "task-1",
    {
      id: "task-1",
      merchantId: "merchant-1",
      status: "draft"
    }
  ]
]);

let nextTaskId = 2;

export const db = {
  createTaskDraft(merchantId: string): DemoTaskRecord {
    const taskId = `task-${nextTaskId++}`;
    const task = { id: taskId, merchantId, status: "draft" as const };

    taskStore.set(taskId, task);

    return task;
  },
  getTask(taskId: string): DemoTaskRecord | undefined {
    return taskStore.get(taskId);
  },
  listTasks(): DemoTaskRecord[] {
    return [...taskStore.values()];
  },
  saveTask(task: DemoTaskRecord): DemoTaskRecord {
    taskStore.set(task.id, task);
    return task;
  }
};
