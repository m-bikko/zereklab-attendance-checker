"use server";

import { getDb } from "@/lib/db";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";

export async function getParentLessonsForWeek(date: Date) {
    const cookieStore = await cookies();
    const parentId = cookieStore.get("auth_id")?.value;

    if (!parentId) return [];

    const db = await getDb();

    // 1. Get Parent's students
    const parent = await db.collection("parents").findOne({ _id: new ObjectId(parentId) });
    if (!parent || !parent.studentIds || parent.studentIds.length === 0) {
        return [];
    }

    const studentIds = parent.studentIds; // Array of strings

    // 2. Find lessons for these students
    const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday start
    const end = endOfWeek(date, { weekStartsOn: 1 });

    const lessons = await db.collection("lessons").aggregate([
        {
            $match: {
                startTime: { $gte: start, $lte: end },
                studentIds: { $in: studentIds } // Only lessons where at least one child is enrolled
            }
        },
        {
            $addFields: {
                subjectObjectId: { $toObjectId: "$subjectId" }
            }
        },
        {
            $lookup: {
                from: "subjects",
                localField: "subjectObjectId",
                foreignField: "_id",
                as: "subject"
            }
        },
        { $unwind: "$subject" },
        {
            $sort: { startTime: 1 }
        }
    ]).toArray();

    // 3. Serialize and return using plain objects
    // Need to handle attendance masking if needed, but UI can do that too.
    return lessons.map(lesson => {
        // Remove BSON fields
        const { subjectObjectId, ...rest } = lesson;

        return {
            ...rest,
            _id: rest._id.toString(),
            subjectId: rest.subjectId.toString(),
            startTime: rest.startTime.toString(),
            endTime: rest.endTime.toString(),
            subject: {
                ...rest.subject,
                _id: rest.subject._id.toString()
            },
            myStudentIds: studentIds
        };
    });
}
