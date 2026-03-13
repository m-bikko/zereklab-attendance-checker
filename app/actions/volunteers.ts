"use server";

import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";

export interface Volunteer {
    _id?: string;
    fullName: string;
    phone: string;
    password: string;
    createdAt?: Date;
}

export interface VolunteerLessonStat {
    lessonId: string;
    subjectName: string;
    date: string; // ISO
    totalStudents: number;
    presentCount: number;
    absentCount: number;
}

export interface VolunteerAbsenceItem {
    lessonId: string;
    subjectName: string;
    date: string;
    studentName: string;
    studentId: string;
}

export async function getVolunteers(): Promise<Volunteer[]> {
    const db = await getDb();
    const list = await db.collection("volunteers").find({}).sort({ createdAt: -1 }).toArray();
    return list.map((v) => ({
        ...v,
        _id: v._id.toString(),
    })) as Volunteer[];
}

export async function createVolunteer(prevState: { message: string; error: boolean }, formData: FormData) {
    const fullName = formData.get("fullName") as string;
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string;

    if (!fullName || !phone || !password) {
        return { message: "Заполните все обязательные поля", error: true };
    }

    try {
        const db = await getDb();

        const existing = await db.collection("volunteers").findOne({ phone });
        if (existing) {
            return { message: "Волонтер с таким телефоном уже существует", error: true };
        }

        await db.collection("volunteers").insertOne({
            fullName,
            phone,
            password,
            createdAt: new Date(),
        });

        revalidatePath("/admin/volunteers");
        return { message: "Волонтер успешно создан", error: false };
    } catch (e) {
        console.error("Create Volunteer Error:", e);
        return { message: "Ошибка при создании", error: true };
    }
}

export async function updateVolunteer(
    id: string,
    prevState: { message: string; error: boolean },
    formData: FormData
) {
    const fullName = formData.get("fullName") as string;
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string;

    if (!fullName || !phone) {
        return { message: "Заполните все обязательные поля", error: true };
    }

    try {
        const db = await getDb();

        const existing = await db.collection("volunteers").findOne({
            phone,
            _id: { $ne: new ObjectId(id) },
        });
        if (existing) {
            return { message: "Волонтер с таким телефоном уже существует", error: true };
        }

        const updateData: Record<string, unknown> = { fullName, phone };
        if (password && password.trim() !== "") {
            updateData.password = password;
        }

        await db.collection("volunteers").updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        revalidatePath("/admin/volunteers");
        return { message: "Успешно обновлен", error: false };
    } catch (e) {
        console.error("Update Volunteer Error:", e);
        return { message: "Ошибка при обновлении", error: true };
    }
}

export async function deleteVolunteer(id: string) {
    try {
        const db = await getDb();
        await db.collection("volunteers").deleteOne({ _id: new ObjectId(id) });
        revalidatePath("/admin/volunteers");
        return { message: "Удален", error: false };
    } catch (e) {
        console.error("Delete Volunteer Error:", e);
        return { message: "Ошибка при удалении", error: true };
    }
}

export async function getVolunteerStats(volunteerId: string): Promise<VolunteerLessonStat[]> {
    if (!volunteerId) return [];

    const db = await getDb();

    // Find all completed lessons where this volunteer is attached
    const lessons = await db.collection("lessons").aggregate([
        {
            $match: {
                status: "completed",
                volunteerIds: volunteerId,
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
        { $sort: { startTime: -1 } }
    ]).toArray();

    return lessons.map((l) => {
        const attendance = (l.attendance as Array<{ studentId: string; present: boolean }> | undefined) || [];
        const presentCount = attendance.filter((a) => a.present).length;
        const absentCount = attendance.filter((a) => !a.present).length;

        return {
            lessonId: l._id.toString(),
            subjectName: l.subject?.name ?? "Неизвестный предмет",
            date: l.startTime instanceof Date ? l.startTime.toISOString() : new Date(l.startTime).toISOString(),
            totalStudents: attendance.length,
            presentCount,
            absentCount,
        };
    });
}

export async function getVolunteerAbsences(volunteerId: string): Promise<VolunteerAbsenceItem[]> {
    if (!volunteerId) return [];

    const db = await getDb();

    const lessons = await db.collection("lessons").aggregate([
        {
            $match: {
                status: "completed",
                volunteerIds: volunteerId,
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
        { $sort: { startTime: -1 } }
    ]).toArray();

    const absences: VolunteerAbsenceItem[] = [];

    for (const lesson of lessons) {
        const attendance = (lesson.attendance as Array<{ studentId: string; present: boolean }> | undefined) || [];
        const absentStudentIds = attendance.filter((a) => !a.present).map((a) => a.studentId);

        if (absentStudentIds.length === 0) continue;

        const students = await db
            .collection("students")
            .find({ _id: { $in: absentStudentIds.map((sid) => new ObjectId(sid)) } })
            .toArray();

        const studentMap = new Map(students.map((s) => [s._id.toString(), s.fullName as string]));

        const lessonDate =
            lesson.startTime instanceof Date
                ? lesson.startTime.toISOString()
                : new Date(lesson.startTime).toISOString();

        for (const sid of absentStudentIds) {
            absences.push({
                lessonId: lesson._id.toString(),
                subjectName: lesson.subject?.name ?? "Неизвестный предмет",
                date: lessonDate,
                studentId: sid,
                studentName: studentMap.get(sid) || "Неизвестный студент",
            });
        }
    }

    return absences;
}
