import React from 'react';
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarControlsProps {
    currentDate: Date;
    onPrev: () => void;
    onNext: () => void;
    onToday: () => void;
}

export const CalendarControls: React.FC<CalendarControlsProps> = ({
    currentDate,
    onPrev,
    onNext,
    onToday,
}) => {
    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold capitalize">
                    {format(currentDate, "MMMM yyyy", { locale: ru })}
                </h2>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onToday}>
                    Сегодня
                </Button>
                <div className="flex items-center rounded-md border bg-background">
                    <Button variant="ghost" size="icon" onClick={onPrev} className="h-8 w-8 rounded-r-none">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="w-[1px] h-4 bg-border" />
                    <Button variant="ghost" size="icon" onClick={onNext} className="h-8 w-8 rounded-l-none">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
