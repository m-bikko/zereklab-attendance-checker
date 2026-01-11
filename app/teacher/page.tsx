"use client";

import { useEffect, useState, useRef } from "react";
import { format, startOfWeek, addDays, isSameDay, getHours, startOfDay, addWeeks, subWeeks } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getLessonsForTeacher } from "@/app/actions/teacher-view";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { AttendanceModal } from "@/components/calendar/AttendanceModal";
import { getStudents } from "@/app/actions/students";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 07:00 to 20:00

export default function TeacherDashboard() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [lessons, setLessons] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [selectedLesson, setSelectedLesson] = useState<any | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    // Get teacher ID from cookie (client-side helper or server component prop)
    // Since we are "use client", we can't read cookies easily without a library or server prop.
    // BUT we can fetch it via a server action or just pass it from layout/server component? 
    // Wait, page.tsx can be server component if I move logic there, but calendar has state.
    // I'll assume cookie is available or use a helper to get "me".
    // Alternatively, I'll fetch "me" from a server action. 

    // Quick Hack: Just read document.cookie? No, it's HTTP Only.
    // So I need a server action `getMe()`.

    // Wait, `getLessonsForTeacher` takes `teacherId`. 
    // I should create a `getMyLessons` wrapper that reads the cookie on the server.
    // Let's assume I modify getLessonsForTeacher to pull ID from cookie if not provided?
    // Or I'll write a small action `getCurrentUser` in auth.ts?
    // Let's try to get `auth_id` from cookie using a new `getMe` action.

    useEffect(() => {
        // Fetch students for modal lookup
        getStudents().then(setStudents);

        // Wait, I don't have api route. I need an action.

        // Let's call an action.
        // Actually, let's just use `getLessonsForTeacher` which I will modify to auto-read cookie if I pass nothing?
        // No, cleaner to pass ID.

        // I will just refactor `getLessonsForTeacher` to read the cookie itself! 
        // That's much more secure anyway.

        loadLessons();
    }, [currentDate]);

    const loadLessons = async () => {
        // We'll call a version that reads the cookie
        const data = await getLessonsForTeacher(currentDate);
        setLessons(data);
    };

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const today = new Date();

    const handlePrevWeek = () => setCurrentDate(prev => subWeeks(prev, 1));
    const handleNextWeek = () => setCurrentDate(prev => addWeeks(prev, 1));
    const handleToday = () => setCurrentDate(new Date());

    const getLessonsForSlot = (day: Date, hour: number) => {
        return lessons.filter(l => {
            const lessonDailyStart = new Date(l.startTime);
            return isSameDay(lessonDailyStart, day) && getHours(lessonDailyStart) === hour;
        });
    };

    const handleLessonClick = (lesson: any) => {
        setSelectedLesson(lesson);
        setModalOpen(true);
    };

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 700; // 7:00 * 100px
        }
    }, []);

    return (
        <div className="flex flex-col h-[calc(100vh-65px)] p-2 md:p-4 max-w-7xl mx-auto">
            <AttendanceModal
                lesson={selectedLesson}
                open={modalOpen}
                onOpenChange={(val) => {
                    setModalOpen(val);
                    if (!val) loadLessons(); // Refresh on close
                }}
                students={students}
            />

            <div className="flex justify-between items-center mb-4">
                <h1 className="text-lg font-bold capitalize">
                    {format(currentDate, "LLLL yyyy", { locale: ru })}
                </h1>
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" onClick={handlePrevWeek}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" onClick={handleToday}>Сегодня</Button>
                    <Button variant="outline" size="icon" onClick={handleNextWeek}><ChevronRight className="h-4 w-4" /></Button>
                </div>
            </div>

            <div
                ref={scrollContainerRef}
                className="flex flex-col border rounded-lg overflow-auto bg-background flex-1 shadow-sm relative"
            >
                <div className="min-w-[800px] md:min-w-0 flex flex-col h-full">
                    {/* Header - Sticky Top */}
                    <div className="flex border-b bg-muted/40 sticky top-0 z-30">
                        <div className="w-16 border-r p-2 shrink-0 bg-muted/40 sticky left-0 z-40 border-b"></div>
                        {weekDays.map((day) => (
                            <div
                                key={day.toISOString()}
                                className={cn(
                                    "flex-1 p-2 text-center border-r last:border-r-0 min-w-[100px] bg-muted/40",
                                    isSameDay(day, today) && "bg-accent/10"
                                )}
                            >
                                <div className={cn(
                                    "text-xs md:text-sm font-medium uppercase",
                                    isSameDay(day, today) ? "text-primary" : "text-muted-foreground"
                                )}>
                                    {format(day, "EEE", { locale: ru })}
                                </div>
                                <div className={cn(
                                    "text-xl md:text-2xl font-bold rounded-full w-8 h-8 flex items-center justify-center mx-auto mt-1",
                                    isSameDay(day, today) && "bg-primary text-primary-foreground"
                                )}>
                                    {format(day, "d")}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Grid Rows */}
                    <div className="flex flex-col flex-1">
                        {HOURS.map((hour) => (
                            <div key={hour} className="flex border-b last:border-b-0 min-h-[100px]">
                                <div className="w-16 border-r p-2 text-xs text-muted-foreground text-right shrink-0 sticky left-0 bg-background z-20 border-b-0">
                                    {format(new Date().setHours(hour, 0, 0, 0), "HH:mm")}
                                </div>

                                {weekDays.map((day) => {
                                    const dayLessons = getLessonsForSlot(day, hour);
                                    return (
                                        <div
                                            key={`${day.toISOString()}-${hour}`}
                                            className={cn(
                                                "flex-1 border-r last:border-r-0 relative min-w-[100px] group hover:bg-muted/30 transition-colors p-1",
                                                isSameDay(day, today) && "bg-accent/5"
                                            )}
                                        >
                                            {dayLessons.map(lesson => {
                                                const start = new Date(lesson.startTime);
                                                const end = new Date(lesson.endTime);
                                                const isCompleted = lesson.status === "completed";

                                                return (
                                                    <div
                                                        key={lesson._id}
                                                        onClick={() => handleLessonClick(lesson)}
                                                        className={cn(
                                                            "border rounded text-xs p-1 mb-1 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity flex flex-col gap-1",
                                                            isCompleted
                                                                ? "bg-green-100 border-green-300 text-green-800"
                                                                : "bg-primary/10 border-primary/20 text-primary"
                                                        )}
                                                    >
                                                        <div className="font-bold truncate">{lesson.subject?.name}</div>
                                                        <div className="text-[10px] opacity-75">
                                                            {format(start, "HH:mm")} - {format(end, "HH:mm")}
                                                        </div>
                                                        {isCompleted && <div className="text-[9px] mt-1 font-bold">✓ Отчет готов</div>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
