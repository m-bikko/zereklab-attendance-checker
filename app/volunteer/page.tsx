"use client";

import { useEffect, useState } from "react";
import { getVolunteerLessonsForWeek, VolunteerLesson } from "@/app/actions/volunteer-view";
import { getStudents, Student } from "@/app/actions/students";
import { startOfWeek, addDays, format, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AttendanceModal } from "@/components/calendar/AttendanceModal";
import { Card, CardContent } from "@/components/ui/card";

export default function VolunteerDashboard() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [lessons, setLessons] = useState<VolunteerLesson[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [selectedLesson, setSelectedLesson] = useState<VolunteerLesson | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    useEffect(() => {
        setLoading(true);
        Promise.all([
            getVolunteerLessonsForWeek(currentDate),
            getStudents()
        ]).then(([l, s]) => {
            setLessons(l);
            setStudents(s);
            setLoading(false);
        });
    }, [currentDate]);

    const nextWeek = () => setCurrentDate(addDays(currentDate, 7));
    const prevWeek = () => setCurrentDate(addDays(currentDate, -7));

    const getLessonsForDay = (day: Date) => {
        return lessons.filter(l => isSameDay(new Date(l.startTime), day));
    };

    const handleLessonClick = (lesson: VolunteerLesson) => {
        setSelectedLesson(lesson);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Моё расписание</h1>
                    <p className="text-muted-foreground">
                        {format(weekStart, "d MMMM", { locale: ru })} - {format(weekDays[6], "d MMMM yyyy", { locale: ru })}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={prevWeek}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
                        Сегодня
                    </Button>
                    <Button variant="outline" size="icon" onClick={nextWeek}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <p className="text-muted-foreground animate-pulse">Загрузка уроков...</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {weekDays.map((day) => {
                        const dayLessons = getLessonsForDay(day);
                        const isToday = isSameDay(day, new Date());

                        if (dayLessons.length === 0) return null;

                        return (
                            <div key={day.toISOString()} className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <h2 className={cn(
                                        "text-sm font-semibold uppercase tracking-wider",
                                        isToday ? "text-primary" : "text-muted-foreground"
                                    )}>
                                        {format(day, "EEEE, d MMMM", { locale: ru })}
                                    </h2>
                                    {isToday && <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded">СЕГОДНЯ</span>}
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {dayLessons.map((lesson) => (
                                        <Card 
                                            key={lesson._id} 
                                            className={cn(
                                                "cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all",
                                                lesson.status === "completed" ? "bg-green-50/50 border-green-200" : ""
                                            )}
                                            onClick={() => handleLessonClick(lesson)}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-sm font-bold text-primary">
                                                        {format(new Date(lesson.startTime), "HH:mm")} - {format(new Date(lesson.endTime), "HH:mm")}
                                                    </span>
                                                    {lesson.status === "completed" && (
                                                        <span className="text-green-600 text-[10px] font-bold bg-green-100 px-2 py-0.5 rounded uppercase">
                                                            Сдано
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="font-bold text-lg mb-1">{lesson.subject?.name}</h3>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <CalendarIcon className="h-3 w-3" />
                                                    <span>{lesson.studentIds?.length || 0} учеников</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                    {lessons.length === 0 && (
                        <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
                            <p className="text-muted-foreground font-medium">На эту неделю уроков нет</p>
                            <p className="text-sm text-muted-foreground mt-1">Отдыхайте или проверьте другую неделю</p>
                        </div>
                    )}
                </div>
            )}

            <AttendanceModal
                lesson={selectedLesson}
                open={isModalOpen}
                onOpenChange={(val) => {
                    setIsModalOpen(val);
                    if (!val) {
                        getVolunteerLessonsForWeek(currentDate).then(setLessons);
                    }
                }}
                students={students}
            />
        </div>
    );
}
