"use client";

import { MobileNav } from "@/components/MobileNav";
import { Sidebar } from "@/components/Sidebar";
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
        <div className="min-h-screen bg-gray-50/50">
            <Sidebar />
            <div className="md:pl-64 flex flex-col min-h-screen">
                <MobileNav />
                <main className="flex-1 p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
