"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralStats, DailyStat, TeacherStat } from "@/app/actions/analytics";
import { Student } from "@/app/actions/students";
import OverviewTab from "./OverviewTab";
import TeachersTab from "./TeachersTab";
import StudentsTab from "./StudentsTab";
import VolunteersTab from "./VolunteersTab";

interface AnalyticsTabsProps {
    generalStats: GeneralStats;
    teacherStats: TeacherStat[];
    students: Student[];
    dailyStats: DailyStat[];
}

export default function AnalyticsTabs({ generalStats, teacherStats, students, dailyStats }: AnalyticsTabsProps) {
    return (
        <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
                <TabsTrigger value="overview">Обзор</TabsTrigger>
                <TabsTrigger value="teachers">Учителя</TabsTrigger>
                <TabsTrigger value="students">Студенты</TabsTrigger>
                <TabsTrigger value="volunteers">Волонтеры</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
                <OverviewTab stats={generalStats} dailyStats={dailyStats} />
            </TabsContent>
            <TabsContent value="teachers" className="space-y-4">
                <TeachersTab stats={teacherStats} />
            </TabsContent>
            <TabsContent value="students" className="space-y-4">
                <StudentsTab allStudents={students} />
            </TabsContent>
            <TabsContent value="volunteers" className="space-y-4">
                <VolunteersTab />
            </TabsContent>
        </Tabs>
    );
}
