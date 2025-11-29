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

      // Collect all streaming logs (outside try-catch for error handling)
      const streamingLogs: string[] = [];

      try {
        // Send initial status
        sendEvent({ type: "start", taskRunId: taskRun.id, message: "Starting task..." });

        // Get notification criteria if configured
        const notifSettings = task.notificationSettings;
        const notificationCriteria = notifSettings?.notificationCriteria;

        streamingLogs.push("🚀 Starting task...");

        console.log('[Stream API] Starting browser task...');

        // Run the browser task with streaming
        const result = await streamBrowserTask(
          task.description,
          task.targetSite,
          notificationCriteria || undefined,
          (step) => {
            // Send each step update to the client
            // The step object structure varies, so we'll handle it flexibly
            const stepData: any = {
              timestamp: new Date().toISOString(),
            };

            // Extract action and thought if they exist
            if (step && typeof step === 'object') {
              if ('action' in step || 'actions' in step) {
                stepData.action = step.action || step.actions;
              }
              if ('thought' in step) {
                stepData.thought = step.thought;
              }
              if ('output' in step) {
                stepData.output = step.output;
              }
              // If none of the above, just stringify the whole step
              if (!stepData.action && !stepData.thought && !stepData.output) {
                stepData.raw = JSON.stringify(step);
              }
            }

            // Add to streaming logs for storage
            if (stepData.thought) {
              streamingLogs.push(`💭 ${stepData.thought}`);
            }
            if (stepData.action) {
              const actionStr = typeof stepData.action === 'string'
                ? stepData.action
                : JSON.stringify(stepData.action);
              streamingLogs.push(`⚡ ${actionStr}`);
            }
            if (stepData.output) {
              streamingLogs.push(`📋 ${stepData.output}`);
            }
            if (stepData.raw) {
              streamingLogs.push(`📝 ${stepData.raw}`);
            }

            sendEvent({
              type: "step",
              step: stepData,
            });
          }
        );

        console.log('[Stream API] Browser task returned, status:', result.status);

        const status = result.status === "completed" ? "success" : "failed";
        const duration = new Date().getTime() - taskRun.startedAt.getTime();

        // Add completion log
        streamingLogs.push(`✅ Task completed in ${(duration / 1000).toFixed(1)}s`);

        console.log('[Stream API] Updating task run in database...');

        // Extract notification criteria evaluation if present
        const aiEvaluation = result.result as any;
        const shouldNotify = aiEvaluation?.shouldNotify;
        const notificationReason = aiEvaluation?.notificationReason;

        // Update the task run with results and streaming logs
        const updatedTaskRun = await db.taskRun.update({
          where: { id: taskRun.id },
          data: {
            status,
            finishedAt: new Date(),
            outputJson: result.result || null,
            errorMsg: result.error || null,
            logs: streamingLogs.join("\n"), // Store all streaming logs
            shouldNotify: shouldNotify !== undefined ? shouldNotify : null,
            notificationReason: notificationReason || null,
          },
        });

        console.log('[Stream API] Database updated, sending completion event...');

        // Send completion event
        sendEvent({
          type: "complete",
          status,
          result: result.result,
          error: result.error,
          duration,
          taskRun: updatedTaskRun,
        });

        console.log('[Stream API] Closing stream controller...');

        // Close the stream immediately - must be the last thing we do
        controller.close();

        console.log('[Stream API] Stream closed successfully');

        // IMPORTANT: No code after controller.close() that could throw errors!
        // Email notifications are fire-and-forget, don't wait for them
        (async () => {
          try {
            if (notifSettings && task.user.emailNotifications && notifSettings.frequency === 'immediate') {
              const aiEvaluation = result.result as any;
              const aiSaysNotify = aiEvaluation?.shouldNotify === true;

              const shouldNotifyEmail =
                (status === 'success' && notifSettings.notifyOnSuccess) ||
                (status === 'failed' && notifSettings.notifyOnFailure) ||
                aiSaysNotify;

              if (shouldNotifyEmail) {
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
              }
            }
          } catch (emailError) {
            console.error('Failed to send email notification:', emailError);
          }
        })().catch(err => console.error('Email notification error:', err));
      } catch (error: any) {
        const duration = new Date().getTime() - taskRun.startedAt.getTime();

        // Add error log
        streamingLogs.push(`❌ Error: ${error?.message ?? "Unknown error"}`);

        // Update task run with error and streaming logs
        const updatedTaskRun = await db.taskRun.update({
          where: { id: taskRun.id },
          data: {
            status: "failed",
            finishedAt: new Date(),
            errorMsg: error?.message ?? "Unknown error",
            logs: streamingLogs.join("\n"), // Store all streaming logs including error
          },
        });

        // Send error event
        sendEvent({
          type: "error",
          error: error?.message ?? "Unknown error",
          taskRun: updatedTaskRun,
        });

        // Close the stream immediately - must be the last thing we do
        controller.close();

        // IMPORTANT: No code after controller.close() that could throw errors!
        // Email notifications are fire-and-forget, don't wait for them
        (async () => {
          try {
            const notifSettings = task.notificationSettings;
            if (notifSettings && task.user.emailNotifications && notifSettings.notifyOnFailure && notifSettings.frequency === 'immediate') {
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
            }
          } catch (emailError) {
            console.error('Failed to send email notification:', emailError);
          }
        })().catch(err => console.error('Email notification error:', err));
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
