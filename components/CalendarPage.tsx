"use client";

import React, { useState } from 'react';
import { addWeeks, subWeeks } from "date-fns";
import { CalendarControls } from "./calendar/CalendarControls";
import { WeeklyView } from "./calendar/WeeklyView";

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());

    const handlePrev = () => setCurrentDate((prev) => subWeeks(prev, 1));
    const handleNext = () => setCurrentDate((prev) => addWeeks(prev, 1));
    const handleToday = () => setCurrentDate(new Date());

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Календарь занятий</h1>
            <CalendarControls
                currentDate={currentDate}
                onPrev={handlePrev}
                onNext={handleNext}
                onToday={handleToday}
            />
            <WeeklyView currentDate={currentDate} />
        </div>
    );
}
