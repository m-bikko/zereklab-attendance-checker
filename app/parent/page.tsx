"use client";

import { useEffect, useState, useRef } from "react";
import { format, startOfWeek, addDays, isSameDay, getHours, startOfDay, addWeeks, subWeeks } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getParentLessonsForWeek } from "@/app/actions/parent-view";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function ParentDashboard() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [lessons, setLessons] = useState<any[]>([]);
    const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);

    useEffect(() => {
        getParentLessonsForWeek(currentDate).then(setLessons);
    }, [currentDate]);

    const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
    const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
    const handleToday = () => setCurrentDate(new Date());

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const today = new Date();

    const getLessonsForSlot = (day: Date, hour: number) => {
        return lessons.filter(l => {
            const lessonStart = new Date(l.startTime);
            return isSameDay(lessonStart, day) && getHours(lessonStart) === hour;
        });
    };

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollContainerRef.current) {
            // Scroll to 07:00. Each hour is min-h-[100px]
            // 7 * 100 = 700
            scrollContainerRef.current.scrollTop = 700;
        }
    }, []);

    return (
        <div className="flex flex-col h-[calc(100vh-65px)] p-2 md:p-4 max-w-7xl mx-auto">
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
                        {/* Corner - Sticky Left & Top */}
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
                                                const myStudentIds = lesson.myStudentIds || [];
                                                const attendance = lesson.attendance || [];

                                                // Determine visual status
                                                const statuses = myStudentIds.map((id: string) => {
                                                    const record = attendance.find((a: any) => a.studentId === id);
                                                    return record ? record.present : null;
                                                });

                                                const isPresent = statuses.some((s: boolean | null) => s === true);
                                                const isAbsent = statuses.some((s: boolean | null) => s === false);
                                                const isMarked = isPresent || isAbsent;

                                                return (
                                                    <div
                                                        key={lesson._id}
                                                        className={cn(
                                                            "border rounded text-xs p-1 mb-1 overflow-hidden flex flex-col gap-1",
                                                            isMarked
                                                                ? (isAbsent ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200")
                                                                : "bg-gray-50 border-gray-200"
                                                        )}
                                                    >
                                                        <div className="font-bold truncate">{lesson.subject?.name}</div>
                                                        <div className="text-[10px] opacity-75">
                                                            {format(start, "HH:mm")} - {format(end, "HH:mm")}
                                                        </div>

                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {myStudentIds.map((sid: string, idx: number) => {
                                                                const record = attendance.find((a: any) => a.studentId === sid);
                                                                const status = record ? record.present : null;
                                                                if (status === null) return null;
                                                                return (
                                                                    <span key={idx} className={cn(
                                                                        "px-1 rounded text-[9px] font-bold flex items-center",
                                                                        status ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100"
                                                                    )}>
                                                                        {status ? <Check className="w-3 h-3 mr-0.5" /> : <X className="w-3 h-3 mr-0.5" />}
                                                                        {status ? "Был" : "Н/Б"}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>

                                                        {lesson.photos && lesson.photos.length > 0 && (
                                                            <div className="flex gap-1 mt-1 overflow-x-auto">
                                                                {lesson.photos.map((url: string, i: number) => (
                                                                    <img
                                                                        key={i}
                                                                        src={url}
                                                                        className="w-8 h-8 object-cover rounded cursor-pointer border hover:opacity-80"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setZoomedPhoto(url);
                                                                        }}
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}
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

            {zoomedPhoto && (
                <Dialog open={!!zoomedPhoto} onOpenChange={() => setZoomedPhoto(null)}>
                    <DialogContent className="max-w-4xl max-h-screen p-0 overflow-hidden bg-black/90 border-none sm:rounded-none">
                        <div className="relative w-full h-full flex items-center justify-center min-h-[50vh]">
                            <img src={zoomedPhoto} alt="Zoomed" className="max-w-full max-h-[90vh] object-contain" />
                            <Button
                                className="absolute top-4 right-4 rounded-full"
                                size="icon"
                                variant="secondary"
                                onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = zoomedPhoto;
                                    link.download = `photo-${Date.now()}.jpg`;
                                    link.target = "_blank";
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
