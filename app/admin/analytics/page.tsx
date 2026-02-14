import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getGeneralStats, getTeacherStats, getDailyStats } from "@/app/actions/analytics";
import { getStudents } from "@/app/actions/students";
import OverviewTab from "./_components/OverviewTab";
import TeachersTab from "./_components/TeachersTab";
import StudentsTab from "./_components/StudentsTab";

export default async function AnalyticsPage() {
    const generalStats = await getGeneralStats();
    const teacherStats = await getTeacherStats();
    const students = await getStudents();
    const dailyStats = await getDailyStats();

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Аналитика</h1>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Обзор</TabsTrigger>
                    <TabsTrigger value="teachers">Учителя</TabsTrigger>
                    <TabsTrigger value="students">Студенты</TabsTrigger>
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
            </Tabs>
        </div>
    );
}
