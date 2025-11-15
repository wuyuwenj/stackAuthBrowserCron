import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runBrowserTask } from "@/lib/browserUse";
import { getNextRunTime } from "@/lib/cronUtils";

// POST /api/run-due-tasks - Run all tasks that are due now
// This endpoint should be called by a cron job (e.g., Vercel Cron, external scheduler)
export async function POST(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron or external scheduler with Bearer token
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Vercel Cron doesn't send auth headers, so we check the User-Agent
    const userAgent = request.headers.get("user-agent") || "";
    const isVercelCron = userAgent.includes("vercel-cron");

    // Allow requests from Vercel Cron OR with valid Bearer token
    if (cronSecret && !isVercelCron && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Get all active tasks that are due now (nextRunAt <= now)
    const dueTasks = await db.task.findMany({
      where: {
        isActive: true,
        nextRunAt: {
          not: null,
          lte: now,
        },
      },
    });

    // Process each due task
    const results = await Promise.allSettled(
      dueTasks.map(async (task) => {
        // Create a task run record
        const taskRun = await db.taskRun.create({
          data: {
            taskId: task.id,
            status: "running",
            startedAt: now,
          },
        });

        try {
          // Run the browser task
          const result = await runBrowserTask(task.description, true, task.targetSite);

          // Update the task run with results
          await db.taskRun.update({
            where: { id: taskRun.id },
            data: {
              status: result.status === "completed" ? "success" : "failed",
              finishedAt: new Date(),
              outputJson: result.result || null,
              errorMsg: result.error || null,
              logs: result.logs?.join("\n") || null,
            },
          });

          // Update task's nextRunAt to the next scheduled time
          if (task.cronSchedule) {
            const nextRunAt = getNextRunTime(task.cronSchedule);
            await db.task.update({
              where: { id: task.id },
              data: { nextRunAt },
            });
          }

          return { taskId: task.id, taskRunId: taskRun.id, success: true };
        } catch (error: any) {
          // Update task run with error
          await db.taskRun.update({
            where: { id: taskRun.id },
            data: {
              status: "failed",
              finishedAt: new Date(),
              errorMsg: error?.message ?? "Unknown error",
            },
          });

          return { taskId: task.id, taskRunId: taskRun.id, success: false, error: error?.message };
        }
      })
    );

    return NextResponse.json({
      processed: dueTasks.length,
      results: results.map((r) => r.status === "fulfilled" ? r.value : { error: r.reason }),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to run due tasks" },
      { status: 500 }
    );
  }
}

// GET /api/run-due-tasks - Run all tasks that are due now (for GitHub Actions)
// This endpoint is called by GitHub Actions cron job
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from GitHub Actions with Bearer token
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Require valid Bearer token for GET requests
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Get all active tasks that are due now (nextRunAt <= now)
    const dueTasks = await db.task.findMany({
      where: {
        isActive: true,
        nextRunAt: {
          not: null,
          lte: now,
        },
      },
    });

    // Process each due task
    const results = await Promise.allSettled(
      dueTasks.map(async (task) => {
        // Create a task run record
        const taskRun = await db.taskRun.create({
          data: {
            taskId: task.id,
            status: "running",
            startedAt: now,
          },
        });

        try {
          // Run the browser task
          const result = await runBrowserTask(task.description, true, task.targetSite);

          // Update the task run with results
          await db.taskRun.update({
            where: { id: taskRun.id },
            data: {
              status: result.status === "completed" ? "success" : "failed",
              finishedAt: new Date(),
              outputJson: result.result || null,
              errorMsg: result.error || null,
              logs: result.logs?.join("\n") || null,
            },
          });

          // Update task's nextRunAt to the next scheduled time
          if (task.cronSchedule) {
            const nextRunAt = getNextRunTime(task.cronSchedule);
            await db.task.update({
              where: { id: task.id },
              data: { nextRunAt },
            });
          }

          return { taskId: task.id, taskRunId: taskRun.id, success: true };
        } catch (error: any) {
          // Update task run with error
          await db.taskRun.update({
            where: { id: taskRun.id },
            data: {
              status: "failed",
              finishedAt: new Date(),
              errorMsg: error?.message ?? "Unknown error",
            },
          });

          return { taskId: task.id, taskRunId: taskRun.id, success: false, error: error?.message };
        }
      })
    );

    return NextResponse.json({
      source: "github-actions",
      processed: dueTasks.length,
      results: results.map((r) => r.status === "fulfilled" ? r.value : { error: r.reason }),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to run due tasks" },
      { status: 500 }
    );
  }
}
