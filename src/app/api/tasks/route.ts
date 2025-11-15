import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { isValidCron, getNextRunTime } from "@/lib/cronUtils";

const createTaskSchema = z.object({
  userId: z.string(),
  name: z.string().min(1),
  description: z.string().min(1),
  targetSite: z.string(),
  cronSchedule: z.string().optional(),
  isActive: z.boolean().optional().default(true),
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
    const body = await request.json();
    const validatedData = createTaskSchema.parse(body);

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

    const task = await db.task.create({
      data: {
        ...validatedData,
        nextRunAt,
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error?.message ?? "Failed to create task" },
      { status: 500 }
    );
  }
}
