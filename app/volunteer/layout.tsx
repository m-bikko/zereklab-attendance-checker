import { logout } from "@/app/actions/auth";
import { getVolunteerInfo } from "@/app/actions/volunteer-view";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

export default async function VolunteerLayout({ children }: { children: React.ReactNode }) {
    const volunteer = await getVolunteerInfo();

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Top nav */}
            <header className="fixed top-0 left-0 right-0 z-30 h-14 border-b bg-background flex items-center px-4 justify-between">
                <div className="flex items-center gap-2 font-semibold text-primary">
                    <Heart className="h-5 w-5" />
                    <span>Кабинет волонтёра</span>
                </div>
                <div className="flex items-center gap-3">
                    {volunteer && (
                        <span className="text-sm text-muted-foreground hidden sm:block">
                            {volunteer.fullName}
                        </span>
                    )}
                    <form action={logout}>
                        <Button variant="outline" size="sm" type="submit">
                            Выйти
                        </Button>
                    </form>
                </div>
            </header>

            <main className="pt-14 p-4 md:p-8 max-w-5xl mx-auto">
                {children}
            </main>
        </div>
    );
}
