import type { CreatorWalletSnapshot, MerchantWalletSnapshot } from "@meow/contracts";
import { db } from "../lib/db.js";

export const getCreatorWalletSnapshot = (
  creatorUserId: string
): CreatorWalletSnapshot => {
  const rewards = db.listRewardsByCreator(creatorUserId);
  const frozenAmount = rewards
    .filter((reward) => reward.status === "frozen")
    .reduce((total, reward) => total + reward.amount, 0);
  const availableAmount = rewards
    .filter((reward) => reward.status === "available")
    .reduce((total, reward) => total + reward.amount, 0);

  return {
    creatorId: creatorUserId,
    frozenAmount,
    availableAmount,
    submissionCount: db.listSubmissionsByCreator(creatorUserId).length
  };
};

export const getMerchantWalletSnapshot = (
  merchantUserId: string
): MerchantWalletSnapshot => {
  const tasks = db
    .listTasks()
    .filter((task) => task.merchantId === merchantUserId && task.status !== "draft");
  const escrowAmount = tasks.reduce(
    (total, task) => total + (task.status === "settled" ? 0 : task.escrowLockedAmount),
    0
  );
  const reservedEscrowAmount = tasks.reduce((total, task) => {
    if (task.status === "settled") {
      return total;
    }

    const rewardAmount = db
      .listRewardsByTask(task.id)
      .filter((reward) => reward.type === "base" || reward.type === "ranking")
      .reduce((rewardTotal, reward) => rewardTotal + reward.amount, 0);

    return total + rewardAmount;
  }, 0);
  const tipSpentAmount = db
    .listTasks()
    .filter((task) => task.merchantId === merchantUserId)
    .reduce((total, task) => {
      const tipAmount = db
        .listRewardsByTask(task.id)
        .filter((reward) => reward.type === "tip")
        .reduce((rewardTotal, reward) => rewardTotal + reward.amount, 0);

      return total + tipAmount;
    }, 0);

  return {
    merchantId: merchantUserId,
    escrowAmount,
    refundableAmount: Math.max(escrowAmount - reservedEscrowAmount, 0),
    tipSpentAmount,
    publishedTaskCount: tasks.length
  };
};
