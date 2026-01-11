"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Users, GraduationCap, BookOpen, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
    const pathname = usePathname();

    const links = [
        { href: "/admin", label: "Календарь", icon: Calendar },
        { href: "/admin/subjects", label: "Предметы", icon: BookOpen },
        { href: "/admin/teachers", label: "Учителя", icon: Users },
        { href: "/admin/students", label: "Студенты", icon: GraduationCap },
        { href: "/admin/parents", label: "Родители", icon: UserCircle },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background p-2 pb-safe md:hidden">
            <div className="flex justify-around items-center">
                {links.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "flex flex-col items-center justify-center p-2 rounded-lg transition-colors min-w-[64px]",
                                isActive
                                    ? "text-primary bg-primary/10"
                                    : "text-muted-foreground hover:bg-muted"
                            )}
                        >
                            <Icon className="h-6 w-6 mb-1" />
                            <span className="text-[10px] font-medium">{label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
