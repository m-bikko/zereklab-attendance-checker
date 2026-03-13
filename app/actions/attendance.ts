"use server";

import clientPromise, { dbName } from "@/lib/db";
import { uploadImage } from "@/lib/cloudinary";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";

export async function saveAttendance(prevState: { message: string; error: boolean }, formData: FormData) {
    const lessonId = formData.get("lessonId") as string;
    const attendanceMapStr = formData.get("attendanceMap") as string;
    const existingPhotosStr = formData.get("existingPhotos") as string | null;
    const volunteerIdsStr = formData.get("volunteerIds") as string | null;

    if (!lessonId || !attendanceMapStr) {
        return { message: "Invalid data", error: true };
    }

    const attendanceMap = JSON.parse(attendanceMapStr) as Record<string, boolean>;
    const existingPhotos: string[] = existingPhotosStr ? JSON.parse(existingPhotosStr) : [];
    const volunteerIds: string[] = volunteerIdsStr ? JSON.parse(volunteerIdsStr) : [];

    try {
        // 1. Upload new photos
        const newPhotos: string[] = [];
        const files = formData.getAll("photos") as File[];

        for (const file of files) {
            if (file.size > 0 && file.name !== "undefined") {
                const url = await uploadImage(file);
                newPhotos.push(url);
            }
        }

        const photos = [...existingPhotos, ...newPhotos];

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
                    volunteerIds,
                    status: "completed",
                    reportUpdatedAt: new Date()
                }
            }
        );

        revalidatePath("/");
        return { message: "Отчет успешно сохранен", error: false };
    } catch (e) {
        console.error(e);
        return { message: "Ошибка при сохранении", error: true };
    }
}
