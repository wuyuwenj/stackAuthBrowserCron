import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runBrowserTask } from "@/lib/browserUse";
import { checkRunLimit } from "@/lib/usage-limits";
import { sendTaskNotification } from "@/lib/email";

// POST /api/tasks/[id]/run - Manually run a task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get the task with notification settings
    const task = await db.task.findUnique({
      where: { id },
      include: {
        notificationSettings: true,
        user: {
          select: { email: true, emailNotifications: true },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check run limit for user's plan
    const runLimitCheck = await checkRunLimit(task.userId);
    if (!runLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: "Run limit reached",
          message: `You've reached your plan's limit of ${runLimitCheck.limit} runs this month. Upgrade your plan to run more tasks.`,
          current: runLimitCheck.current,
          limit: runLimitCheck.limit
        },
        { status: 403 }
      );
    }

    // Create a task run record
    const taskRun = await db.taskRun.create({
      data: {
        taskId: task.id,
        status: "running",
        startedAt: new Date(),
      },
    });

    try {
      // Get notification criteria if configured
      const notifSettings = task.notificationSettings;
      const notificationCriteria = notifSettings?.notificationCriteria;

      // Run the browser task and wait for completion
      const result = await runBrowserTask(
        task.description,
        true,
        task.targetSite,
        notificationCriteria || undefined
      );

      const status = result.status === "completed" ? "success" : "failed";
      const duration = new Date().getTime() - taskRun.startedAt.getTime();

      // Update the task run with results
      const updatedTaskRun = await db.taskRun.update({
        where: { id: taskRun.id },
        data: {
          status,
          finishedAt: new Date(),
          outputJson: result.result || null,
          errorMsg: result.error || null,
          logs: result.logs?.join("\n") || null,
        },
      });

      // Send email notification if configured
      if (notifSettings && task.user.emailNotifications && notifSettings.frequency === 'immediate') {
        // Check if we should notify based on AI evaluation or basic criteria
        const aiEvaluation = result.result as any;
        const aiSaysNotify = aiEvaluation?.shouldNotify === true;

        const shouldNotify =
          (status === 'success' && notifSettings.notifyOnSuccess) ||
          (status === 'failed' && notifSettings.notifyOnFailure) ||
          aiSaysNotify;

        if (shouldNotify) {
          try {
            // Include AI notification reason if available
            let emailOutput = result.result;
            if (aiEvaluation?.notificationReason) {
              emailOutput = {
                ...result.result,
                _notificationReason: aiEvaluation.notificationReason,
              };
            }

            await sendTaskNotification({
              to: notifSettings.email || task.user.email,
              taskName: task.name,
              taskId: task.id,
              status: status as 'success' | 'failure',
              runId: updatedTaskRun.id,
              userId: task.userId,
              output: emailOutput,
              error: result.error,
              duration,
            });
          } catch (emailError) {
            console.error('Failed to send email notification:', emailError);
            // Don't fail the task if email fails
          }
        }
      }

      return NextResponse.json({
        taskRun: updatedTaskRun,
        message: "Task completed",
      });
    } catch (error: any) {
      const duration = new Date().getTime() - taskRun.startedAt.getTime();

      // Update task run with error
      const updatedTaskRun = await db.taskRun.update({
        where: { id: taskRun.id },
        data: {
          status: "failed",
          finishedAt: new Date(),
          errorMsg: error?.message ?? "Unknown error",
        },
      });

      // Send failure notification if configured
      const notifSettings = task.notificationSettings;
      if (notifSettings && task.user.emailNotifications && notifSettings.notifyOnFailure && notifSettings.frequency === 'immediate') {
        try {
          await sendTaskNotification({
            to: notifSettings.email || task.user.email,
            taskName: task.name,
            taskId: task.id,
            status: 'failure',
            runId: updatedTaskRun.id,
            userId: task.userId,
            error: error?.message ?? "Unknown error",
            duration,
          });
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
          // Don't fail the task if email fails
        }
      }

      return NextResponse.json({
        taskRun: updatedTaskRun,
        message: "Task failed",
        error: error?.message ?? "Unknown error",
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to run task" },
      { status: 500 }
    );
  }
}
