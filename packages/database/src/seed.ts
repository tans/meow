import { ledgerAccounts } from "@meow/domain-finance";
import type { DatabaseRepository, TaskRecord } from "./repository.js";

export const demoUsers = {
  merchant: {
    id: "merchant-1",
    identifier: "merchant@example.com",
    displayName: "Demo Merchant",
    roles: ["merchant"] as const
  },
  creator: {
    id: "creator-1",
    identifier: "creator@example.com",
    displayName: "Demo Creator",
    roles: ["creator"] as const
  },
  hybrid: {
    id: "hybrid-1",
    identifier: "hybrid@example.com",
    displayName: "Demo Hybrid",
    roles: ["creator", "merchant"] as const
  },
  operator: {
    id: "operator-1",
    identifier: "operator@example.com",
    displayName: "Demo Operator",
    roles: ["operator"] as const
  }
} as const;

export interface SeedDemoResult {
  merchant: (typeof demoUsers)["merchant"];
  creator: (typeof demoUsers)["creator"];
  hybrid: (typeof demoUsers)["hybrid"];
  operator: (typeof demoUsers)["operator"];
  task: {
    id: string;
    merchantId: string;
    status: TaskRecord["status"];
    escrowLockedAmount: number;
  };
  ledgerAccounts: Array<{ type: (typeof ledgerAccounts)[number] }>;
}

export function seedDemo(repository: DatabaseRepository): SeedDemoResult {
  repository.saveUser({
    ...demoUsers.merchant,
    roles: [...demoUsers.merchant.roles],
    state: "active"
  });
  repository.saveUser({
    ...demoUsers.creator,
    roles: [...demoUsers.creator.roles],
    state: "active"
  });
  repository.saveUser({
    ...demoUsers.hybrid,
    roles: [...demoUsers.hybrid.roles],
    state: "active"
  });
  repository.saveUser({
    ...demoUsers.operator,
    roles: [...demoUsers.operator.roles],
    state: "active"
  });

  const seedTaskId = "task-1";
  const existingTask = repository.getTask(seedTaskId);
  const task =
    existingTask ??
    repository.saveTask({
      id: seedTaskId,
      merchantId: demoUsers.merchant.id,
      status: "draft",
      escrowLockedAmount: 0
    });

  return {
    merchant: demoUsers.merchant,
    creator: demoUsers.creator,
    hybrid: demoUsers.hybrid,
    operator: demoUsers.operator,
    task,
    ledgerAccounts: ledgerAccounts.map((type) => ({ type }))
  };
}
