"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getStudentStats, StudentStats } from "@/app/actions/analytics";
import { Student } from "@/app/actions/students";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface StudentsTabProps {
    allStudents: Student[];
}

export default function StudentsTab({ allStudents }: StudentsTabProps) {
    const [selectedStudentId, setSelectedStudentId] = useState<string>("");
    const [stats, setStats] = useState<StudentStats | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!selectedStudentId) return;
        setLoading(true);
        try {
            const data = await getStudentStats(selectedStudentId);
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch student stats", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Поиск студента</CardTitle>
                    <CardDescription>Выберите студента для просмотра детальной статистики</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-4">
                    <Select onValueChange={setSelectedStudentId} value={selectedStudentId}>
                        <SelectTrigger className="w-[300px]">
                            <SelectValue placeholder="Выберите студента" />
                        </SelectTrigger>
                        <SelectContent>
                            {[...allStudents].sort((a, b) => a.fullName.localeCompare(b.fullName, "ru")).map((student) => (
                                <SelectItem key={student._id} value={student._id!}>
                                    {student.fullName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleSearch} disabled={!selectedStudentId || loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Показать статистику
                    </Button>
                </CardContent>
            </Card>

            {stats && (
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Всего уроков</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.totalLessons}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Присутствовал</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-600">{stats.presentCount}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Пропусков</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-red-600">{stats.absentCount}</div>
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-3">
                        <CardHeader>
                            <CardTitle>История посещений</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {stats.history.length === 0 ? (
                                    <p className="text-muted-foreground">Нет данных о посещениях</p>
                                ) : (
                                    stats.history.map((record, index) => (
                                        <div key={index} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                            <div>
                                                <p className="font-medium">{record.subjectName}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(record.date).toLocaleDateString()} {new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <div className="flex items-center">
                                                {record.present ? (
                                                    <span className="flex items-center text-green-600">
                                                        <CheckCircle2 className="mr-2 h-5 w-5" />
                                                        Присутствовал
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center text-red-600">
                                                        <XCircle className="mr-2 h-5 w-5" />
                                                        Отсутствовал
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
