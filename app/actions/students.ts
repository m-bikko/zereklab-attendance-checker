"use server";

import clientPromise, { dbName } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface Student {
    _id?: string;
    fullName: string;
    createdAt: Date;
}

export async function createStudent(prevState: any, formData: FormData) {
    const fullName = formData.get("fullName") as string;

    if (!fullName) {
        return { message: "Full Name is required", error: true };
    }

    try {
        const client = await clientPromise;
        const db = client.db(dbName);

        await db.collection("students").insertOne({
            fullName,
            createdAt: new Date(),
        });

        revalidatePath("/students");
        return { message: "Student created successfully", error: false };
    } catch (e) {
        console.error(e);
        return { message: "Failed to create student", error: true };
    }
}

export async function getStudents(): Promise<Student[]> {
    const client = await clientPromise;
    const db = client.db(dbName);
    const students = await db.collection("students").find({}).sort({ createdAt: -1 }).toArray();

    // Convert _id to string for serialization
    return students.map((s) => ({
        ...s,
        _id: s._id.toString(),
    })) as unknown as Student[];
}

export async function updateStudent(id: string, prevState: any, formData: FormData) {
    const fullName = formData.get("fullName") as string;

    if (!fullName) {
        return { message: "Full Name is required", error: true };
    }

    try {
        const client = await clientPromise;
        const db = client.db(dbName);
        const { ObjectId } = await import("mongodb");

        await db.collection("students").updateOne(
            { _id: new ObjectId(id) },
            { $set: { fullName } }
        );

        revalidatePath("/admin/students");
        return { message: "Student updated successfully", error: false };
    } catch (e) {
        console.error(e);
        return { message: "Failed to update student", error: true };
    }
}

export async function deleteStudent(id: string) {
    try {
        const client = await clientPromise;
        const db = client.db(dbName);
        const { ObjectId } = await import("mongodb");

        await db.collection("students").deleteOne({ _id: new ObjectId(id) });
        revalidatePath("/admin/students");
        return { message: "Student deleted successfully", error: false };
    } catch (e) {
        console.error(e);
        return { message: "Failed to delete student", error: true };
    }
}
