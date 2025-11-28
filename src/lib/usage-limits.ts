import { Plan } from '@prisma/client';
import { PLANS } from './stripe';
import { db } from './db';

export async function checkTaskLimit(userId: string): Promise<{ allowed: boolean; current: number; limit: number }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { _count: { select: { tasks: true } } },
  });

  if (!user) {
    throw new Error('User not found in database');
  }

  const planLimits = PLANS[user.plan];
  const current = user._count.tasks;
  const limit = planLimits.maxTasks;

  return {
    allowed: current < limit,
    current,
    limit,
  };
}

export async function checkRunLimit(userId: string): Promise<{ allowed: boolean; current: number; limit: number }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      tasks: {
        include: {
          runs: {
            where: {
              startedAt: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Start of current month
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new Error('User not found in database');
  }

  const planLimits = PLANS[user.plan];
  const current = user.tasks.reduce((sum, task) => sum + task.runs.length, 0);
  const limit = planLimits.maxRunsPerMonth;

  return {
    allowed: current < limit,
    current,
    limit,
  };
}

export async function getUserPlan(userId: string): Promise<Plan> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  if (!user) {
    throw new Error('User not found in database');
  }

  return user.plan;
}
