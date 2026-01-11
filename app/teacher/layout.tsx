import { Button } from "@/components/ui/button";
import { logout } from "@/app/actions/auth";
import Link from "next/link";

export default function TeacherLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/teacher" className="font-bold text-xl text-primary">
                            Кабинет Учителя
                        </Link>
                    </div>
                    <div>
                        <form action={logout}>
                            <Button variant="ghost" size="sm">Выйти</Button>
                        </form>
                    </div>
                </div>
            </header>
            <main className="flex-1 w-full">
                {children}
            </main>
        </div>
    );
}
