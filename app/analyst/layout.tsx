import { Button } from "@/components/ui/button";
import { LogOut, BarChart } from "lucide-react";
import { logout } from "@/app/actions/auth";

export default function AnalystLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50/50">
            <header className="border-b bg-background">
                <div className="flex h-14 items-center justify-between px-4 md:px-8">
                    <div className="flex items-center gap-2">
                        <BarChart className="h-5 w-5" />
                        <span className="font-bold text-lg">ZerekLab - Аналитика</span>
                    </div>
                    <form action={logout}>
                        <Button variant="outline" size="sm" className="gap-2">
                            <LogOut className="h-4 w-4" />
                            Выход
                        </Button>
                    </form>
                </div>
            </header>
            <main className="p-4 md:p-8">
                {children}
            </main>
        </div>
    );
}
