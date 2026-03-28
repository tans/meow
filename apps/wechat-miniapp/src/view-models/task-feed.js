export const mapTaskCard = (task) => ({
  id: task.id,
  title: task.title,
  badge: task.status === "published" ? "进行中" : "已下架",
  rewardText: task.rewardText,
  merchantText: task.merchantId ? `商家 ${task.merchantId}` : "公开任务"
});
