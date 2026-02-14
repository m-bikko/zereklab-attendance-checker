"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Users, GraduationCap, BookOpen, UserCircle, BarChart, Menu, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import { logout } from "@/app/actions/auth";

export function MobileNav() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    const links = [
        { href: "/admin", label: "Календарь", icon: Calendar },
        { href: "/admin/subjects", label: "Предметы", icon: BookOpen },
        { href: "/admin/teachers", label: "Учителя", icon: Users },
        { href: "/admin/students", label: "Студенты", icon: GraduationCap },
        { href: "/admin/parents", label: "Родители", icon: UserCircle },
        { href: "/admin/analytics", label: "Аналитика", icon: BarChart },
    ];

    return (
        <div className="md:hidden">
            {/* Top Bar for Mobile */}
            <div className="fixed top-0 left-0 right-0 z-50 border-b bg-background p-4 flex items-center justify-between">
                <span className="font-bold text-lg">ZerekLab</span>
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right">
                        <SheetHeader>
                            <SheetTitle className="text-left">Меню</SheetTitle>
                        </SheetHeader>
                        <div className="flex flex-col h-full py-4">
                            <nav className="flex flex-col gap-2">
                                {links.map(({ href, label, icon: Icon }) => {
                                    const isActive = pathname === href;
                                    return (
                                        <Link
                                            key={href}
                                            href={href}
                                            onClick={() => setOpen(false)}
                                            className={cn(
                                                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                                isActive
                                                    ? "bg-muted text-primary"
                                                    : "text-muted-foreground"
                                            )}
                                        >
                                            <Icon className="h-5 w-5" />
                                            {label}
                                        </Link>
                                    );
                                })}
                            </nav>
                            <div className="mt-auto border-t pt-4">
                                <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground" onClick={() => logout()}>
                                    <LogOut className="h-5 w-5" />
                                    Выход
                                </Button>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
            {/* Spacer to prevent content from hiding behind fixed header */}
            <div className="h-16" />
        </div>
    );
}
