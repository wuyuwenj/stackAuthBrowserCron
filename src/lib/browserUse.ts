import { BrowserUseClient } from "browser-use-sdk";
import { z } from "zod";

if (!process.env.BROWSER_USE_API_KEY) {
  throw new Error("BROWSER_USE_API_KEY is not set in environment variables");
}

const client = new BrowserUseClient({
  apiKey: process.env.BROWSER_USE_API_KEY,
});

export interface BrowserTaskResult {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  result?: any;
  error?: string;
  logs?: string[];
}

// Default output schema - structured result array
const DefaultTaskOutput = z.object({
  result: z.array(z.string()),
});

// Output schema with notification evaluation
const TaskOutputWithNotification = z.object({
  result: z.array(z.string()),
  shouldNotify: z.boolean(),
  notificationReason: z.string().optional(),
});

/**
 * Run a browser automation task using Browser Use Cloud
 * @param taskDescription Natural language description of the task
 * @param waitForCompletion Whether to wait for task completion (default: true)
 * @param startUrl Optional starting URL for the browser
 * @param notificationCriteria Optional AI-evaluated notification criteria
 * @returns Task result with status and output
 */
export async function runBrowserTask(
  taskDescription: string,
  waitForCompletion: boolean = true,
  startUrl?: string,
  notificationCriteria?: string
): Promise<BrowserTaskResult> {
  try {
    // Build the task prompt with optional notification criteria
    let fullTaskDescription = taskDescription;

    if (notificationCriteria) {
      fullTaskDescription += `\n\nIMPORTANT NOTIFICATION EVALUATION:
After completing the task above, evaluate this notification condition:
"${notificationCriteria}"

Based on what you found during the task, determine if this condition is TRUE or FALSE.
- Set shouldNotify to true if the condition is met
- Set shouldNotify to false if the condition is not met
- In notificationReason, briefly explain why (e.g., "$49 flight found for March 15" or "No flights under $50 found")`;
    }

    // Create the task using the correct SDK method with structured output
    const task = await client.tasks.createTask({
      task: fullTaskDescription,
      startUrl: startUrl || null,
      schema: notificationCriteria ? TaskOutputWithNotification : DefaultTaskOutput,
    });

    if (!waitForCompletion) {
      return {
        id: task.id || "",
        status: "pending",
      };
    }

    // Poll for completion instead of using task.complete()
    const maxAttempts = 60; // 5 minutes (5 seconds * 60)
    let attempts = 0;

    while (attempts < maxAttempts) {
      const taskStatus = await client.tasks.getTask({ task_id: task.id! });

      if (taskStatus.status === "finished") {
        return {
          id: task.id || "",
          status: "completed",
          result: (taskStatus as any).parsed || (taskStatus as any).output,
          logs: (taskStatus as any).logs || [],
        };
      }

      if (taskStatus.status === "stopped") {
        throw new Error("Task was stopped");
      }

      // Wait 5 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    }

    throw new Error("Task completion timeout after 5 minutes");
  } catch (error: any) {
    return {
      id: "",
      status: "failed",
      error: error?.message ?? "Unknown error occurred",
    };
  }
}

/**
 * Get the status of a browser task
 * @param taskId The ID of the task
 * @returns Task status and result
 */
export async function getTaskStatus(taskId: string): Promise<BrowserTaskResult> {
  try {
    // Note: This may need adjustment based on SDK's actual API
    const result = await client.tasks.getTask({ task_id: taskId });

    return {
      id: taskId,
      status: result.status as any,
      result: (result as any).output,
      logs: (result as any).logs || [],
    };
  } catch (error: any) {
    return {
      id: taskId,
      status: "failed",
      error: error?.message ?? "Failed to get task status",
    };
  }
}

/**
 * Stream a browser task with real-time updates
 * @param taskDescription Natural language description of the task
 * @param startUrl Optional starting URL for the browser
 * @param notificationCriteria Optional AI-evaluated notification criteria
 * @param onStep Callback for each step update
 * @returns Final task result
 */
export async function streamBrowserTask(
  taskDescription: string,
  startUrl?: string,
  notificationCriteria?: string,
  onStep?: (step: any) => void
): Promise<BrowserTaskResult> {
  try {
    // Build the task prompt with optional notification criteria
    let fullTaskDescription = taskDescription;

    if (notificationCriteria) {
      fullTaskDescription += `\n\nIMPORTANT NOTIFICATION EVALUATION:
After completing the task above, evaluate this notification condition:
"${notificationCriteria}"

Based on what you found during the task, determine if this condition is TRUE or FALSE.
- Set shouldNotify to true if the condition is met
- Set shouldNotify to false if the condition is not met
- In notificationReason, briefly explain why (e.g., "$49 flight found for March 15" or "No flights under $50 found")`;
    }

    // Create the task using the correct SDK method with structured output
    const task = await client.tasks.createTask({
      task: fullTaskDescription,
      startUrl: startUrl || null,
      schema: notificationCriteria ? TaskOutputWithNotification : DefaultTaskOutput,
    });

    const logs: string[] = [];

    console.log('[Browser Use] Starting to stream task steps...');

    // Start streaming task steps (but don't wait for it to finish, since it may hang)
    let streamFinished = false;
    const streamTask = (async () => {
      try {
        for await (const step of task.stream()) {
          // Call the callback if provided
          if (onStep) {
            onStep(step);
          }

          // Collect logs - just stringify the whole step for now
          logs.push(`Step: ${JSON.stringify(step)}`);
        }
        streamFinished = true;
        console.log('[Browser Use] Stream ended naturally');
      } catch (err) {
        console.error('[Browser Use] Stream error:', err);
      }
    })();

    // Poll task status instead of waiting for stream to finish
    let taskComplete = false;
    let result: any = null;
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes (5 seconds * 120)

    while (!taskComplete && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      attempts++;

      console.log(`[Browser Use] Polling task status (attempt ${attempts})...`);

      try {
        const taskStatus = await client.tasks.getTask({ task_id: task.id! });
        console.log('[Browser Use] Task status:', taskStatus.status);

        if (taskStatus.status === "finished") {
          console.log('[Browser Use] Task finished!');
          result = taskStatus;
          taskComplete = true;
          break;
        }
        // Note: Browser Use SDK may not have "stopped" or "failed" status
        // Just keep polling if status is still "created" or "started"
      } catch (err) {
        console.error('[Browser Use] Error polling task:', err);
        throw err;
      }
    }

    if (!taskComplete) {
      throw new Error('Task completion timeout after 10 minutes');
    }

    console.log('[Browser Use] Task completed successfully, result:', result);

    return {
      id: task.id || "",
      status: "completed",
      result: (result as any).parsed || (result as any).output,
      logs,
    };
  } catch (error: any) {
    return {
      id: "",
      status: "failed",
      error: error?.message ?? "Unknown error occurred",
    };
  }
}
