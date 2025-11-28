import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { streamBrowserTask } from "@/lib/browserUse";
import { checkRunLimit } from "@/lib/usage-limits";
import { sendTaskNotification } from "@/lib/email";

// POST /api/tasks/[id]/run-stream - Run a task with streaming updates
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    return new Response(
      JSON.stringify({ error: "Task not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  // Check run limit for user's plan
  const runLimitCheck = await checkRunLimit(task.userId);
  if (!runLimitCheck.allowed) {
    return new Response(
      JSON.stringify({
        error: "Run limit reached",
        message: `You've reached your plan's limit of ${runLimitCheck.limit} runs this month. Upgrade your plan to run more tasks.`,
        current: runLimitCheck.current,
        limit: runLimitCheck.limit
      }),
      { status: 403, headers: { "Content-Type": "application/json" } }
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

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Helper to send SSE message
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Send initial status
        sendEvent({ type: "start", taskRunId: taskRun.id, message: "Starting task..." });

        // Get notification criteria if configured
        const notifSettings = task.notificationSettings;
        const notificationCriteria = notifSettings?.notificationCriteria;

        // Run the browser task with streaming
        const result = await streamBrowserTask(
          task.description,
          task.targetSite,
          notificationCriteria || undefined,
          (step) => {
            // Send each step update to the client
            sendEvent({
              type: "step",
              step: {
                action: step.action,
                thought: step.thought,
                timestamp: new Date().toISOString(),
              },
            });
          }
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

        // Send completion event
        sendEvent({
          type: "complete",
          status,
          result: result.result,
          error: result.error,
          duration,
          taskRun: updatedTaskRun,
        });

        // Send email notification if configured
        if (notifSettings && task.user.emailNotifications && notifSettings.frequency === 'immediate') {
          const aiEvaluation = result.result as any;
          const aiSaysNotify = aiEvaluation?.shouldNotify === true;

          const shouldNotify =
            (status === 'success' && notifSettings.notifyOnSuccess) ||
            (status === 'failed' && notifSettings.notifyOnFailure) ||
            aiSaysNotify;

          if (shouldNotify) {
            try {
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
            }
          }
        }

        controller.close();
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

        // Send error event
        sendEvent({
          type: "error",
          error: error?.message ?? "Unknown error",
          taskRun: updatedTaskRun,
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
          }
        }

        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
