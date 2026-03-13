"use server";

import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";

export interface HomeroomTeacher {
    _id?: string;
    fullName: string;
    phone: string;
    password: string;
    studentIds: string[];
    createdAt?: Date;
}

export interface HomeroomStudentAttendanceStat {
    studentId: string;
    studentName: string;
    totalLessons: number;
    presentCount: number;
    absentCount: number;
    attendanceRate: number;
}

export async function getHomeroomTeachers(): Promise<HomeroomTeacher[]> {
    const db = await getDb();
    const list = await db.collection("homeroom_teachers").find({}).sort({ createdAt: -1 }).toArray();
    return list.map((h) => ({
        ...h,
        _id: h._id.toString(),
        studentIds: h.studentIds || [],
    })) as HomeroomTeacher[];
}

export async function createHomeroomTeacher(prevState: { message: string; error: boolean }, formData: FormData) {
    const fullName = formData.get("fullName") as string;
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string;
    const studentIdsRaw = formData.get("studentIds") as string;

    let studentIds: string[] = [];
    try {
        studentIds = JSON.parse(studentIdsRaw || "[]");
    } catch {
        return { message: "Ошибка данных студентов", error: true };
    }

    if (!fullName || !phone || !password) {
        return { message: "Заполните все обязательные поля", error: true };
    }

    try {
        const db = await getDb();

        const existing = await db.collection("homeroom_teachers").findOne({ phone });
        if (existing) {
            return { message: "Классный руководитель с таким телефоном уже существует", error: true };
        }

        await db.collection("homeroom_teachers").insertOne({
            fullName,
            phone,
            password,
            studentIds,
            createdAt: new Date(),
        });

        revalidatePath("/admin/homeroom-teachers");
        return { message: "Классный руководитель успешно создан", error: false };
    } catch (e) {
        console.error("Create HomeroomTeacher Error:", e);
        return { message: "Ошибка при создании", error: true };
    }
}

export async function updateHomeroomTeacher(
    id: string,
    prevState: { message: string; error: boolean },
    formData: FormData
) {
    const fullName = formData.get("fullName") as string;
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string;
    const studentIdsRaw = formData.get("studentIds") as string;

    let studentIds: string[] = [];
    try {
        studentIds = JSON.parse(studentIdsRaw || "[]");
    } catch {
        return { message: "Ошибка данных студентов", error: true };
    }

    if (!fullName || !phone) {
        return { message: "Заполните все обязательные поля", error: true };
    }

    try {
        const db = await getDb();

        const existing = await db.collection("homeroom_teachers").findOne({
            phone,
            _id: { $ne: new ObjectId(id) },
        });
        if (existing) {
            return { message: "Классный руководитель с таким телефоном уже существует", error: true };
        }

        const updateData: Record<string, unknown> = { fullName, phone, studentIds };
        if (password && password.trim() !== "") {
            updateData.password = password;
        }

        await db.collection("homeroom_teachers").updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        revalidatePath("/admin/homeroom-teachers");
        return { message: "Успешно обновлен", error: false };
    } catch (e) {
        console.error("Update HomeroomTeacher Error:", e);
        return { message: "Ошибка при обновлении", error: true };
    }
}

export async function deleteHomeroomTeacher(id: string) {
    try {
        const db = await getDb();
        await db.collection("homeroom_teachers").deleteOne({ _id: new ObjectId(id) });
        revalidatePath("/admin/homeroom-teachers");
        return { message: "Удален", error: false };
    } catch (e) {
        console.error("Delete HomeroomTeacher Error:", e);
        return { message: "Ошибка при удалении", error: true };
    }
}

export async function getHomeroomTeacherStats(homeroomTeacherId: string): Promise<HomeroomStudentAttendanceStat[]> {
    if (!homeroomTeacherId) return [];

    const db = await getDb();

    // Get homeroom teacher's students
    const ht = await db.collection("homeroom_teachers").findOne({ _id: new ObjectId(homeroomTeacherId) });
    if (!ht || !ht.studentIds || ht.studentIds.length === 0) return [];

    const studentIds: string[] = ht.studentIds;

    // Get all students info
    const students = await db
        .collection("students")
        .find({ _id: { $in: studentIds.map((sid) => new ObjectId(sid)) } })
        .toArray();

    const studentMap = new Map(students.map((s) => [s._id.toString(), s.fullName as string]));

    // For each student, calculate attendance stats from completed lessons
    const stats: HomeroomStudentAttendanceStat[] = [];

    for (const studentId of studentIds) {
        const lessons = await db
            .collection("lessons")
            .find({ status: "completed", "attendance.studentId": studentId })
            .toArray();

        let presentCount = 0;
        let absentCount = 0;

        for (const lesson of lessons) {
            const att = (lesson.attendance as Array<{ studentId: string; present: boolean }> | undefined) || [];
            const record = att.find((a) => a.studentId === studentId);
            if (record) {
                if (record.present) presentCount++;
                else absentCount++;
            }
        }

        const totalLessons = presentCount + absentCount;

        stats.push({
            studentId,
            studentName: studentMap.get(studentId) || "Неизвестный студент",
            totalLessons,
            presentCount,
            absentCount,
            attendanceRate: totalLessons > 0 ? (presentCount / totalLessons) * 100 : 0,
        });
    }

    return stats;
}
