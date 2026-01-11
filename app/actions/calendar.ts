"use server";

import clientPromise, { dbName } from "@/lib/db";
import { startOfWeek, endOfWeek } from "date-fns";
import { Lesson } from "./subjects";

export async function getLessonsForWeek(date: Date) {
    const client = await clientPromise;
    const db = client.db(dbName);

    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });

    // Aggregate to join Subject info for display
    const lessons = await db.collection("lessons").aggregate([
        {
            $match: {
                startTime: { $gte: start, $lte: end }
            }
        },
        {
            $lookup: {
                from: "subjects",
                let: { subjectId: { $toObjectId: "$subjectId" } },
                pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$subjectId"] } } }
                ],
                as: "subject"
            }
        },
        {
            $unwind: "$subject"
        },
        {
            $sort: { startTime: 1 }
        }
    ]).toArray();

    return lessons.map(l => ({
        ...l,
        _id: l._id.toString(),
        subjectId: l.subjectId.toString(),
        startTime: l.startTime.toISOString(),
        endTime: l.endTime.toISOString(),
        subject: {
            ...l.subject,
            _id: l.subject._id.toString()
        }
    }));
}
