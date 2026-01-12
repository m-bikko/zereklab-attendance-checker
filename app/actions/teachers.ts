"use server";

import clientPromise, { dbName } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface Teacher {
    _id?: string;
    fullName: string;
    phone: string;
    password?: string;
    createdAt: Date;
}

export async function createTeacher(prevState: any, formData: FormData) {
    const fullName = formData.get("fullName") as string;
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string;

    if (!fullName || !phone || !password) {
        return { message: "Full Name, Phone and Password are required", error: true };
    }

    try {
        const client = await clientPromise;
        const db = client.db(dbName);

        await db.collection("teachers").insertOne({
            fullName,
            phone,
            password, // In a real app, hash this. Here per requirements: checking simple
            createdAt: new Date(),
        });

        revalidatePath("/teachers");
        return { message: "Teacher created successfully", error: false };
    } catch (e) {
        console.error(e);
        return { message: "Failed to create teacher", error: true };
    }
}

export async function getTeachers(): Promise<Teacher[]> {
    const client = await clientPromise;
    const db = client.db(dbName);
    const teachers = await db.collection("teachers").find({}).sort({ createdAt: -1 }).toArray();

    // Convert _id to string for serialization
    return teachers.map((t) => ({
        ...t,
        _id: t._id.toString(),
    })) as unknown as Teacher[];
}

export async function updateTeacher(id: string, prevState: any, formData: FormData) {
    const fullName = formData.get("fullName") as string;
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string; // Optional update

    if (!fullName || !phone) {
        return { message: "Full Name and Phone are required", error: true };
    }

    try {
        const client = await clientPromise;
        const db = client.db(dbName);
        const { ObjectId } = await import("mongodb");

        const updateData: any = { fullName, phone };
        if (password && password.trim() !== "") {
            updateData.password = password;
        }

        await db.collection("teachers").updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        revalidatePath("/admin/teachers");
        return { message: "Teacher updated successfully", error: false };
    } catch (e) {
        console.error(e);
        return { message: "Failed to update teacher", error: true };
    }
}

export async function deleteTeacher(id: string) {
    try {
        const client = await clientPromise;
        const db = client.db(dbName);
        const { ObjectId } = await import("mongodb");

        await db.collection("teachers").deleteOne({ _id: new ObjectId(id) });
        revalidatePath("/admin/teachers");
        return { message: "Teacher deleted successfully", error: false };
    } catch (e) {
        console.error(e);
        return { message: "Failed to delete teacher", error: true };
    }
}
