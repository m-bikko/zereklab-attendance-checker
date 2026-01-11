"use server";

import clientPromise, { dbName } from "@/lib/db";
import { uploadImage } from "@/lib/cloudinary";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";

export async function saveAttendance(prevState: any, formData: FormData) {
    const lessonId = formData.get("lessonId") as string;
    const studentIds = formData.getAll("studentId") as string[];
    // In the form, we'll use checkboxes with value=studentId. If checked, they are present.
    // Wait, better to have specific "present" status.
    // Let's assume the form sends "attendance" as JSON string or we parse entries.

    // Revised approach:
    // content of 'attendance' field will be JSON string: { [studentId]: boolean }
    const attendanceMapStr = formData.get("attendanceMap") as string;

    if (!lessonId || !attendanceMapStr) {
        return { message: "Invalid data", error: true };
    }

    const attendanceMap = JSON.parse(attendanceMapStr) as Record<string, boolean>;

    try {
        // 1. Upload Photos
        const photos: string[] = [];
        const files = formData.getAll("photos") as File[];

        for (const file of files) {
            if (file.size > 0 && file.name !== "undefined") {
                const url = await uploadImage(file);
                photos.push(url);
            }
        }

        // 2. Prepare Attendance Array
        const attendance = Object.entries(attendanceMap).map(([studentId, present]) => ({
            studentId,
            present
        }));

        // 3. Update DB
        const client = await clientPromise;
        const db = client.db(dbName);

        await db.collection("lessons").updateOne(
            { _id: new ObjectId(lessonId) },
            {
                $set: {
                    attendance,
                    photos,
                    status: "completed",
                    reportUpdatedAt: new Date()
                }
            }
        );

        revalidatePath("/");
        return { message: "Отчет успешно сохранен", error: false }; // "Report saved successfully" localized
    } catch (e) {
        console.error(e);
        return { message: "Ошибка при сохранении", error: true }; // "Error saving" local
    }
}
