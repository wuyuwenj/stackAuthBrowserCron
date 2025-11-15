import CronParser from "cron-parser";

/**
 * Check if a cron schedule is due to run now
 * @param cronExpression Cron expression (e.g., "0 9 * * MON")
 * @param now Current date/time
 * @param withinMinutes How many minutes to look ahead (default: 5)
 * @returns True if the task should run now
 */
export function isDueNow(
  cronExpression: string,
  now: Date = new Date(),
  withinMinutes: number = 5
): boolean {
  try {
    const interval = CronParser.parse(cronExpression, {
      currentDate: new Date(now.getTime() - withinMinutes * 60 * 1000),
    });

    const nextRun = interval.next().toDate();
    const timeDiff = Math.abs(nextRun.getTime() - now.getTime());

    // If next run is within withinMinutes, consider it due
    return timeDiff <= withinMinutes * 60 * 1000;
  } catch (error) {
    console.error("Invalid cron expression:", cronExpression, error);
    return false;
  }
}

/**
 * Get the next run time for a cron expression
 * @param cronExpression Cron expression
 * @returns Next run date or null if invalid
 */
export function getNextRunTime(cronExpression: string): Date | null {
  try {
    const interval = CronParser.parse(cronExpression);
    return interval.next().toDate();
  } catch (error) {
    console.error("Invalid cron expression:", cronExpression, error);
    return null;
  }
}

/**
 * Validate a cron expression
 * @param cronExpression Cron expression to validate
 * @returns True if valid
 */
export function isValidCron(cronExpression: string): boolean {
  try {
    CronParser.parse(cronExpression);
    return true;
  } catch (error) {
    return false;
  }
}
