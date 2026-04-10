import { getGeneralStats, getTeacherStats, getDailyStats } from "@/app/actions/analytics";
import { getStudents } from "@/app/actions/students";
import AnalyticsTabs from "@/app/admin/analytics/_components/AnalyticsTabs";

export default async function AnalystPage() {
    const generalStats = await getGeneralStats();
    const teacherStats = await getTeacherStats();
    const students = await getStudents();
    const dailyStats = await getDailyStats();

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight">Аналитика</h1>
            <AnalyticsTabs
                generalStats={generalStats}
                teacherStats={teacherStats}
                students={students}
                dailyStats={dailyStats}
            />
        </div>
    );
}
