"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Users, GraduationCap, BookOpen, UserCircle, BarChart, LogOut, UserCheck, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/actions/auth";

export function Sidebar() {
    const pathname = usePathname();

    const links = [
        { href: "/admin", label: "Календарь", icon: Calendar },
        { href: "/admin/subjects", label: "Предметы", icon: BookOpen },
        { href: "/admin/teachers", label: "Учителя", icon: Users },
        { href: "/admin/students", label: "Студенты", icon: GraduationCap },
        { href: "/admin/parents", label: "Родители", icon: UserCircle },
        { href: "/admin/homeroom-teachers", label: "Класс. руководители", icon: UserCheck },
        { href: "/admin/volunteers", label: "Волонтеры", icon: Heart },
        { href: "/admin/analytics", label: "Аналитика", icon: BarChart },
    ];

    return (
        <div className="hidden border-r bg-gray-100/40 md:block w-64 h-full fixed left-0 top-0 bottom-0 overflow-y-auto">
            <div className="flex flex-col h-full">
                <div className="flex h-14 items-center border-b px-6 font-bold text-lg">
                    ZerekLab
                </div>
                <div className="flex-1 py-4">
                    <nav className="grid items-start px-4 text-sm font-medium">
                        {links.map(({ href, label, icon: Icon }) => {
                            const isActive = pathname === href;
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                        isActive
                                            ? "bg-gray-200 text-primary"
                                            : "text-muted-foreground"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                <div className="border-t p-4">
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={() => logout()}>
                        <LogOut className="h-4 w-4" />
                        Выход
                    </Button>
                </div>
            </div>
        </div>
    );
}
