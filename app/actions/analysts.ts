"use server";

import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";

export interface Analyst {
    _id?: string;
    fullName: string;
    phone: string;
    password: string;
    createdAt?: Date;
}

export async function getAnalysts(): Promise<Analyst[]> {
    const db = await getDb();
    const list = await db.collection("analysts").find({}).sort({ createdAt: -1 }).toArray();
    return list.map((a) => ({
        ...a,
        _id: a._id.toString(),
    })) as Analyst[];
}

export async function createAnalyst(prevState: { message: string; error: boolean }, formData: FormData) {
    const fullName = formData.get("fullName") as string;
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string;

    if (!fullName || !phone || !password) {
        return { message: "Заполните все обязательные поля", error: true };
    }

    try {
        const db = await getDb();

        const existing = await db.collection("analysts").findOne({ phone });
        if (existing) {
            return { message: "Аналитик с таким телефоном уже существует", error: true };
        }

        await db.collection("analysts").insertOne({
            fullName,
            phone,
            password,
            createdAt: new Date(),
        });

        revalidatePath("/admin/analysts");
        return { message: "Аналитик успешно создан", error: false };
    } catch (e) {
        console.error("Create Analyst Error:", e);
        return { message: "Ошибка при создании", error: true };
    }
}

export async function updateAnalyst(
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

        const existing = await db.collection("analysts").findOne({
            phone,
            _id: { $ne: new ObjectId(id) },
        });
        if (existing) {
            return { message: "Аналитик с таким телефоном уже существует", error: true };
        }

        const updateData: Record<string, unknown> = { fullName, phone };
        if (password && password.trim() !== "") {
            updateData.password = password;
        }

        await db.collection("analysts").updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        revalidatePath("/admin/analysts");
        return { message: "Успешно обновлен", error: false };
    } catch (e) {
        console.error("Update Analyst Error:", e);
        return { message: "Ошибка при обновлении", error: true };
    }
}

export async function deleteAnalyst(id: string) {
    try {
        const db = await getDb();
        await db.collection("analysts").deleteOne({ _id: new ObjectId(id) });
        revalidatePath("/admin/analysts");
        return { message: "Удален", error: false };
    } catch (e) {
        console.error("Delete Analyst Error:", e);
        return { message: "Ошибка при удалении", error: true };
    }
}
