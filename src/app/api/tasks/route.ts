import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { isValidCron, getNextRunTime } from "@/lib/cronUtils";
import { checkTaskLimit } from "@/lib/usage-limits";

const notificationRuleSchema = z.object({
  id: z.string(),
  type: z.enum(['text_contains', 'text_not_contains', 'output_contains']),
  value: z.string(),
  enabled: z.boolean(),
});

const notificationSettingsSchema = z.object({
  notifyOnSuccess: z.boolean(),
  notifyOnFailure: z.boolean(),
  email: z.union([z.string().email(), z.literal('')]).optional(),
  frequency: z.enum(['immediate', 'daily', 'weekly']),
  notificationCriteria: z.string().optional(), // AI-powered criteria
  customRules: z.array(notificationRuleSchema),
}).optional();

const createTaskSchema = z.object({
  userId: z.string(),
  name: z.string().min(1),
  description: z.string().min(1),
  targetSite: z.string(),
  cronSchedule: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  notificationSettings: notificationSettingsSchema,
});

// GET /api/tasks - List all tasks (with optional userId filter)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    const tasks = await db.task.findMany({
      where: userId ? { userId } : undefined,
      include: {
        _count: {
          select: { runs: true },
        },
        runs: {
          select: { status: true },
          orderBy: { startedAt: "desc" },
          take: 10,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from Stack Auth
    const { stackServerApp } = await import('@/stack/server');
    const stackUser = await stackServerApp.getUser();

    if (!stackUser) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createTaskSchema.parse(body);

    // Ensure user exists in database (auto-create if needed from Stack Auth)
    let user = await db.user.findUnique({
      where: { id: stackUser.id },
    });

    if (!user) {
      // Create user in our database from Stack Auth data
      user = await db.user.create({
        data: {
          id: stackUser.id,
          email: stackUser.primaryEmail || `${stackUser.id}@stackauth.temp`,
          name: stackUser.displayName || 'User',
          plan: 'FREE',
        },
      });
    }

    // Check task limit for user's plan
    const taskLimitCheck = await checkTaskLimit(stackUser.id);
    if (!taskLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: "Task limit reached",
          message: `You've reached your plan's limit of ${taskLimitCheck.limit} tasks. Upgrade your plan to create more tasks.`,
          current: taskLimitCheck.current,
          limit: taskLimitCheck.limit
        },
        { status: 403 }
      );
    }

    // Validate cron expression if provided
    if (validatedData.cronSchedule && !isValidCron(validatedData.cronSchedule)) {
      return NextResponse.json(
        { error: "Invalid cron expression" },
        { status: 400 }
      );
    }

    // Calculate nextRunAt if cron schedule is provided and task is active
    const nextRunAt = validatedData.cronSchedule && validatedData.isActive
      ? getNextRunTime(validatedData.cronSchedule)
      : null;

    // Extract notification settings from validated data
    const { notificationSettings, userId: _, ...taskData } = validatedData;

    const task = await db.task.create({
      data: {
        ...taskData,
        userId: stackUser.id, // Use authenticated user's ID
        nextRunAt,
        // Create notification settings if provided and email is specified
        ...(notificationSettings && notificationSettings.email && {
          notificationSettings: {
            create: {
              notifyOnSuccess: notificationSettings.notifyOnSuccess,
              notifyOnFailure: notificationSettings.notifyOnFailure,
              email: notificationSettings.email,
              frequency: notificationSettings.frequency,
              notificationCriteria: notificationSettings.notificationCriteria || undefined,
              customRules: notificationSettings.customRules || [],
            },
          },
        }),
      },
      include: {
        notificationSettings: true,
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error: any) {
    console.error('Task creation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error?.message ?? "Failed to create task", details: error?.stack },
      { status: 500 }
    );
  }
}
