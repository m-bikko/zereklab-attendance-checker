"use client";

import { MobileNav } from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/actions/auth";


export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // MobileNav is safe here because this layout only wraps /admin pages, 
    // and /login is at root.
    return (
        <div className="min-h-screen pb-16 md:pb-0">
            <header className="p-4 border-b flex justify-between items-center bg-white">
                <span className="font-bold text-xl">Админ Панель</span>
                <Button variant="ghost" onClick={() => logout()}>Выход</Button>
            </header>
            <main>
                {children}
            </main>
            <MobileNav />
        </div>
    );
}
