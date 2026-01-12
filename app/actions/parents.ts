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

export async function updateParent(id: string, prevState: any, formData: FormData) {
    const fullName = formData.get("fullName") as string;
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string; // Optional
    const studentIdsRaw = formData.get("studentIds") as string;

    let studentIds: string[] = [];
    try {
        studentIds = JSON.parse(studentIdsRaw || "[]");
    } catch (e) {
        return { message: "Ошибка данных студентов", error: true };
    }

    if (!fullName || !phone) {
        return { message: "Заполните все обязательные поля", error: true };
    }

    try {
        const db = await getDb();
        const { ObjectId } = await import("mongodb");

        const updateData: any = { fullName, phone, studentIds };
        if (password && password.trim() !== "") {
            updateData.password = password;
        }

        // Check if phone already exists for OTHER parent
        const existing = await db.collection("parents").findOne({
            phone,
            _id: { $ne: new ObjectId(id) }
        });

        if (existing) {
            return { message: "Родитель с таким телефоном уже существует", error: true };
        }

        await db.collection("parents").updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        revalidatePath("/admin/parents");
        return { message: "Родитель успешно обновлен", error: false };
    } catch (e) {
        console.error("Update Parent Error:", e);
        return { message: "Ошибка при обновлении родителя", error: true };
    }
}

export async function deleteParent(id: string) {
    try {
        const db = await getDb();
        const { ObjectId } = await import("mongodb");

        await db.collection("parents").deleteOne({ _id: new ObjectId(id) });
        revalidatePath("/admin/parents");
        return { message: "Родитель успешно удален", error: false };
    } catch (e) {
        console.error("Delete Parent Error:", e);
        return { message: "Ошибка при удалении родителя", error: true };
    }
}
