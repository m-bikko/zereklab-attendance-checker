"use server";

import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { redirect } from "next/navigation";

export async function login(prevState: any, formData: FormData) {
    const loginInput = formData.get("login") as string; // Accepts username or phone
    const password = formData.get("password") as string;

    // 1. Check Admin Logic (Hardcoded)
    if (loginInput === "admin" && password === "adminpassword") {
        const cookieStore = await cookies();
        cookieStore.set("auth_role", "admin", { httpOnly: true, path: "/" });
        // Return a property to instruct the client where to redirect
        return { message: "Success", error: false, redirectUrl: "/admin" };
    }

    // 2. Check Parent Logic (Database)
    // Parent login is their phone number (digits only usually)
    const db = await getDb();
    const cleanLogin = loginInput.replace(/\s/g, '');

    const parent = await db.collection("parents").findOne({
        phone: cleanLogin
    });

    if (parent && parent.password === password) {
        const cookieStore = await cookies();
        cookieStore.set("auth_role", "parent", { httpOnly: true, path: "/" });
        cookieStore.set("auth_id", parent._id.toString(), { httpOnly: true, path: "/" });
        return { message: "Success", error: false, redirectUrl: "/parent" };
    }

    // 3. Check Teacher Logic (Database)
    const teacher = await db.collection("teachers").findOne({
        phone: cleanLogin
    });

    if (teacher && teacher.password === password) {
        const cookieStore = await cookies();
        cookieStore.set("auth_role", "teacher", { httpOnly: true, path: "/" });
        cookieStore.set("auth_id", teacher._id.toString(), { httpOnly: true, path: "/" });
        return { message: "Success", error: false, redirectUrl: "/teacher" };
    }

    return { message: "Неверный логин или пароль", error: true };
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete("auth_role");
    cookieStore.delete("auth_id");
    redirect("/");
}
