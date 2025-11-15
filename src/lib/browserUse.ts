import { BrowserUseClient } from "browser-use-sdk";

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

/**
 * Run a browser automation task using Browser Use Cloud
 * @param taskDescription Natural language description of the task
 * @param waitForCompletion Whether to wait for task completion (default: true)
 * @returns Task result with status and output
 */
export async function runBrowserTask(
  taskDescription: string,
  waitForCompletion: boolean = true
): Promise<BrowserTaskResult> {
  try {
    // Create the task using the correct SDK method
    const task = await client.tasks.createTask({
      task: taskDescription,
    });

    if (!waitForCompletion) {
      return {
        id: task.id || "",
        status: "pending",
      };
    }

    // Wait for completion
    const result = await task.complete();

    return {
      id: task.id || "",
      status: "completed",
      result: result.output,
      logs: (result as any).logs || [],
    };
  } catch (error: any) {
    console.error("Browser Use task failed:", error);
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
