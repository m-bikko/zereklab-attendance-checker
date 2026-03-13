"use server";

import { getDb } from "@/lib/db";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import {
    startOfWeek,
    endOfWeek,
    addDays,
} from "date-fns";

interface AttendanceRecord {
    studentId: string;
    present: boolean;
}

export interface VolunteerLesson {
    _id: string;
    subjectId: string;
    startTime: Date;
    endTime: Date;
    status: string;
    studentIds: string[];
    volunteerIds: string[];
    attendance?: AttendanceRecord[];
    photos?: string[];
    subject?: {
        _id: string;
        name: string;
        color?: string;
    };
}

export async function getVolunteerLessonsForWeek(date: Date): Promise<VolunteerLesson[]> {
    const cookieStore = await cookies();
    const volunteerId = cookieStore.get("auth_id")?.value;

    if (!volunteerId) return [];

    const db = await getDb();

    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(addDays(weekStart, 6), { weekStartsOn: 1 });

    const lessons = await db.collection("lessons").aggregate([
        {
            $match: {
                volunteerIds: volunteerId,
                startTime: { $gte: weekStart, $lte: weekEnd },
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
        { $unwind: { path: "$subject", preserveNullAndEmptyArrays: true } },
        { $sort: { startTime: 1 } },
    ]).toArray();

    return lessons.map((l) => ({
        ...l,
        _id: l._id.toString(),
        subject: l.subject
            ? { ...l.subject, _id: l.subject._id.toString() }
            : undefined,
    })) as VolunteerLesson[];
}

export async function getVolunteerInfo() {
    const cookieStore = await cookies();
    const volunteerId = cookieStore.get("auth_id")?.value;
    if (!volunteerId) return null;

    const db = await getDb();
    const volunteer = await db.collection("volunteers").findOne({ _id: new ObjectId(volunteerId) });
    if (!volunteer) return null;

    return {
        _id: volunteer._id.toString(),
        fullName: volunteer.fullName as string,
        phone: volunteer.phone as string,
    };
}
