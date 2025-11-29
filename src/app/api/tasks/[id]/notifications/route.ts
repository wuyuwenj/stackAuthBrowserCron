import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const notificationRuleSchema = z.object({
  id: z.string(),
  type: z.enum(['text_contains', 'text_not_contains', 'output_contains']),
  value: z.string(),
  enabled: z.boolean(),
});

const updateNotificationSettingsSchema = z.object({
  notifyOnSuccess: z.boolean(),
  notifyOnFailure: z.boolean(),
  email: z.string().email(),
  frequency: z.enum(['immediate', 'daily', 'weekly']),
  notificationCriteria: z.string().optional(),
  customRules: z.array(notificationRuleSchema).optional(),
});

// PUT /api/tasks/[id]/notifications - Update notification settings
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateNotificationSettingsSchema.parse(body);

    // Check if task exists
    const task = await db.task.findUnique({
      where: { id },
      include: { notificationSettings: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    let notificationSettings;

    if (task.notificationSettings) {
      // Update existing notification settings
      notificationSettings = await db.notificationSettings.update({
        where: { taskId: id },
        data: {
          notifyOnSuccess: validatedData.notifyOnSuccess,
          notifyOnFailure: validatedData.notifyOnFailure,
          email: validatedData.email,
          frequency: validatedData.frequency,
          notificationCriteria: validatedData.notificationCriteria || null,
          customRules: validatedData.customRules || [],
        },
      });
    } else {
      // Create new notification settings
      notificationSettings = await db.notificationSettings.create({
        data: {
          taskId: id,
          notifyOnSuccess: validatedData.notifyOnSuccess,
          notifyOnFailure: validatedData.notifyOnFailure,
          email: validatedData.email,
          frequency: validatedData.frequency,
          notificationCriteria: validatedData.notificationCriteria || null,
          customRules: validatedData.customRules || [],
        },
      });
    }

    return NextResponse.json({ notificationSettings });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error?.message ?? "Failed to update notification settings" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id]/notifications - Delete notification settings
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if notification settings exist
    const task = await db.task.findUnique({
      where: { id },
      include: { notificationSettings: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (!task.notificationSettings) {
      return NextResponse.json({ error: "Notification settings not found" }, { status: 404 });
    }

    await db.notificationSettings.delete({
      where: { taskId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to delete notification settings" },
      { status: 500 }
    );
  }
}
