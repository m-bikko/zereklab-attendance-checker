"use server";

import clientPromise, { dbName } from "@/lib/db";
import { startOfWeek, endOfWeek } from "date-fns";
import { cookies } from "next/headers";

export async function getLessonsForTeacher(date: Date) {
    const cookieStore = await cookies();
    const teacherId = cookieStore.get("auth_id")?.value;

    if (!teacherId) return [];

    const client = await clientPromise;
    const db = client.db(dbName);

    const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday start
    const end = endOfWeek(date, { weekStartsOn: 1 });

    const lessons = await db.collection("lessons").aggregate([
        {
            $match: {
                teacherId: teacherId,
                startTime: { $gte: start, $lte: end }
            }
        },
        {
            $lookup: {
                from: "subjects",
                let: { subjectIdObj: { $toObjectId: "$subjectId" } },
                pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$subjectIdObj"] } } }
                ],
                as: "subject"
            }
        },
        {
            $unwind: { path: "$subject", preserveNullAndEmptyArrays: true }
        },
        { $sort: { startTime: 1 } }
    ]).toArray();

    return lessons.map(lesson => ({
        ...lesson,
        _id: lesson._id.toString(),
        subjectId: lesson.subjectId.toString(),
        teacherId: lesson.teacherId.toString(),
        startTime: lesson.startTime.toISOString(),
        endTime: lesson.endTime.toISOString(),
        subject: lesson.subject ? {
            ...lesson.subject,
            _id: lesson.subject._id.toString(),
            startDate: lesson.subject.startDate ? new Date(lesson.subject.startDate).toISOString() : null,
            periodicityEndDate: lesson.subject.periodicityEndDate ? new Date(lesson.subject.periodicityEndDate).toISOString() : null,
            createdAt: lesson.subject.createdAt ? new Date(lesson.subject.createdAt).toISOString() : null,
        } : null
    }));
}
