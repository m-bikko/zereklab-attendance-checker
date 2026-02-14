import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeacherStat } from "@/app/actions/analytics";

interface TeachersTabProps {
    stats: TeacherStat[];
}

export default function TeachersTab({ stats }: TeachersTabProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Эффективность преподавателей</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ФИО Преподавателя</TableHead>
                            <TableHead>Проведено уроков</TableHead>
                            <TableHead>Средняя посещаемость</TableHead>
                            <TableHead className="text-right">Статус</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stats.map((teacher) => (
                            <TableRow key={teacher._id}>
                                <TableCell className="font-medium">{teacher.name}</TableCell>
                                <TableCell>{teacher.totalLessons}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-[100px]">
                                            <div
                                                className={`bg-blue-600 h-2.5 rounded-full`}
                                                style={{ width: `${teacher.averageAttendance}%` }}
                                            ></div>
                                        </div>
                                        <span>{teacher.averageAttendance.toFixed(1)}%</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    {teacher.totalLessons > 0 ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Активен
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            Нет уроков
                                        </span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
