"use server";

import clientPromise, { dbName } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { addDays, format, getDay, isAfter, isBefore, parse, setHours, setMinutes, startOfDay } from "date-fns";

export interface ScheduleRule {
    dayOfWeek: number; // 0 (Sun) - 6 (Sat)
    startTime: string; // "HH:mm"
    endTime: string; // "HH:mm"
}

export interface Subject {
    _id?: string;
    name: string;
    teacherId: string;
    studentIds: string[];
    schedule: ScheduleRule[];
    periodicityEndDate: Date;
    startDate: Date;
    active: boolean;
}

export interface Lesson {
    _id?: string;
    subjectId: string;
    teacherId: string;
    studentIds: string[];
    startTime: Date;
    endTime: Date;
    status: "scheduled" | "completed" | "cancelled";
}

export async function createSubject(prevState: any, formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const name = rawData.name as string;
    const teacherId = rawData.teacherId as string;
    const startDateStr = rawData.startDate as string;
    const periodicityEndDateStr = rawData.periodicityEndDate as string;

    // Parse complex JSON fields
    const studentIds = JSON.parse(rawData.studentIds as string) as string[];
    const schedule = JSON.parse(rawData.schedule as string) as ScheduleRule[];

    if (!name || !teacherId || studentIds.length === 0 || schedule.length === 0 || !periodicityEndDateStr || !startDateStr) {
        return { message: "All fields are required", error: true };
    }

    try {
        const client = await clientPromise;
        const db = client.db(dbName);

        const startDate = startOfDay(new Date(startDateStr));
        const periodicityEndDate = startOfDay(new Date(periodicityEndDateStr));

        if (isAfter(startDate, periodicityEndDate)) {
            return { message: "Start Date cannot be after End Date", error: true };
        }

        // 1. Create Subject
        const subjectDoc = {
            name,
            teacherId,
            studentIds,
            schedule,
            startDate,
            periodicityEndDate,
            active: true,
            createdAt: new Date(),
        };

        const result = await db.collection("subjects").insertOne(subjectDoc);
        const subjectId = result.insertedId.toString();

        // 2. Generate Lessons
        const lessons: any[] = [];
        let cursorDate = new Date(startDate);

        while (isBefore(cursorDate, addDays(periodicityEndDate, 1))) {
            const dayOfWeek = getDay(cursorDate);

            // Find rules for this day
            const rules = schedule.filter(r => r.dayOfWeek === dayOfWeek);

            rules.forEach(rule => {
                const [startHour, startMinute] = rule.startTime.split(':').map(Number);
                const [endHour, endMinute] = rule.endTime.split(':').map(Number);

                // Create base date from cursor
                const lessonStart = new Date(cursorDate);
                const lessonEnd = new Date(cursorDate);

                // Set time. logic:
                // Server (UTC) sets hours to X. E.g. 14:00 -> 14:00 UTC.
                // We want 14:00 Local (UTC+5). That is 09:00 UTC.
                // So we need to set (14 - 5) hours.
                // We assume input rules are in "Local School Time" (UTC+5).

                const TIMEZONE_OFFSET = 5;

                lessonStart.setUTCHours(startHour - TIMEZONE_OFFSET, startMinute, 0, 0);
                lessonEnd.setUTCHours(endHour - TIMEZONE_OFFSET, endMinute, 0, 0);

                lessons.push({
                    subjectId,
                    teacherId,
                    studentIds,
                    startTime: lessonStart,
                    endTime: lessonEnd,
                    status: "scheduled",
                });
            });

            cursorDate = addDays(cursorDate, 1);
        }

        if (lessons.length > 0) {
            await db.collection("lessons").insertMany(lessons);
        }

        revalidatePath("/subjects");
        revalidatePath("/"); // Update calendar
        return { message: "Subject and schedule created successfully", error: false };

    } catch (e) {
        console.error(e);
        return { message: "Failed to create subject", error: true };
    }
}

export async function getSubjects() {
    const client = await clientPromise;
    const db = client.db(dbName);
    const subjects = await db.collection("subjects").find({}).sort({ createdAt: -1 }).toArray();

    // Need to aggregate with Teachers to get names for display if needed, 
    // but for now just returning raw subject data with IDs
    return subjects.map(s => ({
        ...s,
        _id: s._id.toString(),
        // Serializing dates
        startDate: s.startDate.toISOString(),
        periodicityEndDate: s.periodicityEndDate.toISOString(),
    }));
}

export async function deleteSubject(id: string) {
    try {
        const client = await clientPromise;
        const db = client.db(dbName);
        const { ObjectId } = await import("mongodb");

        // Delete subject
        await db.collection("subjects").deleteOne({ _id: new ObjectId(id) });

        // Delete all future lessons? Or all lessons?
        // Usually, we want to keep history. But if "Delete Entity", user expects it gone.
        // Let's delete future scheduled lessons.
        const today = startOfDay(new Date());
        await db.collection("lessons").deleteMany({
            subjectId: id,
            startTime: { $gte: today }
        });

        // Or maybe just mark as inactive? User asked for "Delete". 
        // I will delete the subject doc, which breaks the link effectively.
        // And clean up future lessons to avoid clutter.

        revalidatePath("/admin/subjects");
        return { message: "Предмет удален", error: false };
    } catch (e) {
        console.error(e);
        return { message: "Ошибка при удалении предмета", error: true };
    }
}

export async function updateSubject(id: string, prevState: any, formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const name = rawData.name as string;
    const teacherId = rawData.teacherId as string;

    // For now, complicated to update schedule/students and regenerate lessons seamlessly without massive logic.
    // So we will only allow updating Name, Teacher, and Active status.
    // If they want to change students/schedule, they should create a new subject or we need a specific "Regenerate" flow.
    // But let's try to support students update at least (it affects future lessons if we were generating them on fly, but we pre-generated).
    // Pre-generated lessons have studentIds in them.

    // Simplest approach: Update Subject Doc. 
    // AND Update FUTURE lessons with new teacher/students.

    const studentIds = JSON.parse(rawData.studentIds as string) as string[];

    try {
        const client = await clientPromise;
        const db = client.db(dbName);
        const { ObjectId } = await import("mongodb");

        await db.collection("subjects").updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    name,
                    teacherId,
                    studentIds
                }
            }
        );

        // Update future lessons to reflect new teacher/students
        const today = startOfDay(new Date());
        await db.collection("lessons").updateMany(
            {
                subjectId: id,
                startTime: { $gte: today },
                status: "scheduled"
            },
            {
                $set: {
                    teacherId,
                    studentIds
                }
            }
        );

        revalidatePath("/admin/subjects");
        return { message: "Предмет обновлен", error: false };
    } catch (e) {
        console.error(e);
        return { message: "Ошибка при обновлении предмета", error: true };
    }
}
