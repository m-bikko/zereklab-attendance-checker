import React, { useEffect, useState } from 'react';
import { startOfWeek, addDays, format, isSameDay, getHours, getMinutes } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getLessonsForWeek } from "@/app/actions/calendar";
import { getSubjects } from "@/app/actions/subjects";
import { getStudents } from "@/app/actions/students";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AttendanceModal } from "./AttendanceModal";

interface WeeklyViewProps {
    currentDate: Date;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const WeeklyView: React.FC<WeeklyViewProps> = ({ currentDate }) => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const today = new Date();

    const [lessons, setLessons] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [filterSubject, setFilterSubject] = useState<string>("all");

    // Modal State
    const [selectedLesson, setSelectedLesson] = useState<any>(null);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        getLessonsForWeek(currentDate).then(setLessons);
        getSubjects().then(setSubjects);
        getStudents().then(setStudents);
    }, [currentDate]);

    const filteredLessons = filterSubject === "all"
        ? lessons
        : lessons.filter(l => l.subjectId === filterSubject);

    const getLessonsForSlot = (day: Date, hour: number) => {
        return filteredLessons.filter(l => {
            const lessonStart = new Date(l.startTime);
            return isSameDay(lessonStart, day) && getHours(lessonStart) === hour;
        });
    };

    const handleLessonClick = (lesson: any) => {
        setSelectedLesson(lesson);
        setModalOpen(true);
    };

    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollContainerRef.current) {
            // Scroll to 07:00. Each hour is min-h-[80px]
            // We scroll slightly less to give some headroom (e.g. 6:30) or exact 7:00
            // 7 * 80 = 560
            scrollContainerRef.current.scrollTop = 560;
        }
    }, [currentDate]); // Re-scroll when week changes? Or only on mount? 
    // Usually only on mount is better, but if date changes maybe we want to keep position? 
    // User asked "starts displaying from 07:00", implies initial state.
    // Let's do it on mount (empty deps) or when switching to new week if we want it to reset. 
    // Let's stick to initial mount for now, but `currentDate` changes weekly view, 
    // so if user scrolls and changes week, preserving scroll is better. 
    // Actually, if I change week, components might re-render. 
    // Let's just do it on mount. 

    useEffect(() => {
        // Initial scroll on mount
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 560;
        }
    }, []);

    return (
        <div className="flex flex-col h-full relative">
            <AttendanceModal
                lesson={selectedLesson}
                open={modalOpen}
                onOpenChange={(val) => {
                    setModalOpen(val);
                    if (!val) {
                        // Refresh lessons when modal closes to show updated status
                        getLessonsForWeek(currentDate).then(setLessons);
                    }
                }}
                students={students}
            />

            <div className="mb-4 flex items-center justify-end">
                <Select value={filterSubject} onValueChange={setFilterSubject}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Фильтр по предмету" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Все предметы</SelectItem>
                        {subjects.map(s => (
                            <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div
                ref={scrollContainerRef}
                className="flex flex-col h-[600px] border rounded-lg overflow-auto bg-background relative"
            >
                <div className="min-w-[800px] md:min-w-0"> {/* Wrapper for horizontal scroll on mobile */}
                    {/* Header - Sticky Top */}
                    <div className="flex border-b bg-muted/40 sticky top-0 z-30">
                        {/* Corner - Sticky Left & Top */}
                        <div className="w-16 border-r p-2 shrink-0 bg-muted/40 sticky left-0 z-40 border-b"></div>
                        {weekDays.map((day) => (
                            <div
                                key={day.toISOString()}
                                className={cn(
                                    "flex-1 p-2 text-center border-r last:border-r-0 min-w-[100px] bg-muted/40",
                                    isSameDay(day, today) && "bg-accent/10" // Needs background to cover content when scrolling
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
                    <div className="flex flex-col">
                        {HOURS.map((hour) => (
                            <div key={hour} className="flex border-b last:border-b-0 min-h-[80px]">
                                {/* Time Label - Sticky Left */}
                                <div className="w-16 border-r p-2 text-xs text-muted-foreground text-right shrink-0 sticky left-0 bg-background z-20 border-b-0">
                                    {format(new Date().setHours(hour, 0, 0, 0), "HH:mm")}
                                </div>

                                {/* Days Columns */}
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
                                                            "border rounded text-xs p-1 mb-1 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity",
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
};
