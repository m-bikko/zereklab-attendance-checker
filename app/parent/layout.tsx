"use client";

import { Button } from "@/components/ui/button";
import { logout } from "@/app/actions/auth";

export default function ParentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen">
            <header className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-50">
                <span className="font-bold text-xl">Кабинет Родителя</span>
                <Button variant="ghost" onClick={() => logout()}>Выход</Button>
            </header>
            <main>
                {children}
            </main>
        </div>
    );
}
