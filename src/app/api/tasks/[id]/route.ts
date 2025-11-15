import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { isValidCron, getNextRunTime } from "@/lib/cronUtils";

const updateTaskSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  targetSite: z.string().optional(),
  cronSchedule: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/tasks/[id] - Get a specific task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const task = await db.task.findUnique({
      where: { id },
      include: {
        runs: {
          orderBy: { startedAt: "desc" },
          take: 10,
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to fetch task" },
      { status: 500 }
    );
  }
}

// PUT /api/tasks/[id] - Update a task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);

    // Validate cron expression if provided
    if (validatedData.cronSchedule && !isValidCron(validatedData.cronSchedule)) {
      return NextResponse.json(
        { error: "Invalid cron expression" },
        { status: 400 }
      );
    }

    // Get current task to check if cron or isActive changed
    const currentTask = await db.task.findUnique({ where: { id } });
    if (!currentTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Recalculate nextRunAt if cron schedule or isActive status changed
    let nextRunAt: Date | null | undefined = undefined;
    const cronChanged = validatedData.cronSchedule !== undefined &&
                        validatedData.cronSchedule !== currentTask.cronSchedule;
    const isActiveChanged = validatedData.isActive !== undefined &&
                            validatedData.isActive !== currentTask.isActive;

    if (cronChanged || isActiveChanged) {
      const newCronSchedule = validatedData.cronSchedule ?? currentTask.cronSchedule;
      const newIsActive = validatedData.isActive ?? currentTask.isActive;

      nextRunAt = newCronSchedule && newIsActive
        ? getNextRunTime(newCronSchedule)
        : null;
    }

    const task = await db.task.update({
      where: { id },
      data: {
        ...validatedData,
        ...(nextRunAt !== undefined && { nextRunAt }),
      },
    });

    return NextResponse.json({ task });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error?.message ?? "Failed to update task" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to delete task" },
      { status: 500 }
    );
  }
}
