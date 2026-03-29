import type { SettleTaskResponse } from "@meow/contracts";
import { db } from "../lib/db.js";
import { AppError } from "../lib/errors.js";
import {
  refundUnusedEscrow,
  releaseEscrowRewardsToFrozen,
  releaseFrozenRewardsToAvailable
} from "./ledger.js";

const sumAmounts = (amounts: number[]) =>
  amounts.reduce((total, amount) => total + amount, 0);

export const settleTask = (
  merchantUserId: string,
  taskId: string
): SettleTaskResponse => {
  const task = db.getTask(taskId);

  if (!task) {
    throw new AppError(404, "task not found");
  }

  if (task.merchantId !== merchantUserId) {
    throw new AppError(403, "merchant does not own task");
  }

  const rewards = db.listRewardsByTask(taskId).filter((reward) => reward.status === "frozen");
  const escrowRewardTotal = sumAmounts(
    rewards
      .filter((reward) => reward.type === "base" || reward.type === "ranking")
      .map((reward) => reward.amount)
  );
  const totalFrozenRewardAmount = sumAmounts(rewards.map((reward) => reward.amount));
  const merchantRefundDelta = Math.max(task.escrowLockedAmount - escrowRewardTotal, 0);

  if (escrowRewardTotal > 0) {
    db.appendLedgerEntries(releaseEscrowRewardsToFrozen(taskId, escrowRewardTotal));
  }

  if (totalFrozenRewardAmount > 0) {
    db.appendLedgerEntries(
      releaseFrozenRewardsToAvailable(taskId, totalFrozenRewardAmount)
    );
  }

  if (merchantRefundDelta > 0) {
    db.appendLedgerEntries(refundUnusedEscrow(taskId, merchantRefundDelta));
  }

  rewards.forEach((reward) => {
    db.saveReward({
      ...reward,
      status: "available"
    });
  });

  db.saveTask({
    ...task,
    status: "settled"
  });

  return {
    taskId,
    status: "settled",
    creatorAvailableDelta: totalFrozenRewardAmount,
    merchantRefundDelta
  };
};
