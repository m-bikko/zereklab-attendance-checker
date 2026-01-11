"use server";

import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface Parent {
    _id?: string;
    fullName: string;
    phone: string; // Unique login identifier
    password: string; // Plaintext for "simple" auth as requested
    studentIds: string[];
}

export async function getParents() {
    const db = await getDb();
    const parents = await db.collection("parents").find().toArray();

    // Convert multiple students to array of objects if needed, or just IDs.
    // We also need student names for display. 
    // Usually we fetch parents then match students.
    // For simple list, just IDs.

    return parents.map(p => ({
        ...p,
        _id: p._id.toString(),
        studentIds: p.studentIds || []
    })) as Parent[];
}

export async function createParent(prevState: any, formData: FormData) {
    const fullName = formData.get("fullName") as string;
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string;
    // studentIds come as a JSON string from multi-select
    const studentIdsRaw = formData.get("studentIds") as string;

    let studentIds: string[] = [];
    try {
        studentIds = JSON.parse(studentIdsRaw || "[]");
    } catch (e) {
        return { message: "Ошибка данных студентов", error: true };
    }

    if (!fullName || !phone || !password) {
        return { message: "Заполните все обязательные поля", error: true };
    }

    try {
        const db = await getDb();

        // Check uniqueness
        const existing = await db.collection("parents").findOne({ phone });
        if (existing) {
            return { message: "Родитель с таким телефоном уже существует", error: true };
        }

        await db.collection("parents").insertOne({
            fullName,
            phone,
            password,
            studentIds,
            createdAt: new Date(),
        });

        revalidatePath("/admin/parents");
        return { message: "Родитель успешно создан", error: false };
    } catch (e) {
        console.error("Create Parent Error:", e);
        return { message: "Ошибка при создании родителя", error: true };
    }
}

export async function deleteParent(id: string) {
    // ... if needed
}
