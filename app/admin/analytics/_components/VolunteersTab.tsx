"use client";

import { useEffect, useState } from "react";
import {
    getVolunteers,
    getVolunteerStats,
    getVolunteerAbsences,
    Volunteer,
    VolunteerLessonStat,
    VolunteerAbsenceItem,
} from "@/app/actions/volunteers";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function VolunteersTab() {
    const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
    const [selectedId, setSelectedId] = useState<string>("");
    const [lessonStats, setLessonStats] = useState<VolunteerLessonStat[]>([]);
    const [absences, setAbsences] = useState<VolunteerAbsenceItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getVolunteers().then(setVolunteers);
    }, []);

    useEffect(() => {
        if (!selectedId) return;
        setLoading(true);
        Promise.all([
            getVolunteerStats(selectedId),
            getVolunteerAbsences(selectedId),
        ]).then(([stats, abs]) => {
            setLessonStats(stats);
            setAbsences(abs);
            setLoading(false);
        });
    }, [selectedId]);

    const totalLessons = lessonStats.length;
    const totalPresent = lessonStats.reduce((s, l) => s + l.presentCount, 0);
    const totalAbsent = lessonStats.reduce((s, l) => s + l.absentCount, 0);
    const totalPossible = totalPresent + totalAbsent;
    const overallRate = totalPossible > 0 ? (totalPresent / totalPossible) * 100 : 0;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Select value={selectedId} onValueChange={setSelectedId}>
                    <SelectTrigger className="max-w-xs">
                        <SelectValue placeholder="Выберите волонтера" />
                    </SelectTrigger>
                    <SelectContent>
                        {volunteers.map((v) => (
                            <SelectItem key={v._id} value={v._id!}>
                                {v.fullName}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {volunteers.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        Нет волонтеров. Добавьте их на странице{" "}
                        <a href="/admin/volunteers" className="underline text-primary">
                            Волонтеры
                        </a>
                        .
                    </p>
                )}
            </div>

            {loading && (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            )}

            {!loading && selectedId && (
                <>
                    {/* Summary cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <p className="text-3xl font-bold">{totalLessons}</p>
                                <p className="text-xs text-muted-foreground mt-1">Уроков с волонтером</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <p className="text-3xl font-bold text-green-600">{totalPresent}</p>
                                <p className="text-xs text-muted-foreground mt-1">Всего присутствий</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <p className="text-3xl font-bold text-red-500">{totalAbsent}</p>
                                <p className="text-xs text-muted-foreground mt-1">Всего пропусков</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <p className={cn(
                                    "text-3xl font-bold",
                                    overallRate >= 80 ? "text-green-600" : overallRate >= 60 ? "text-yellow-600" : "text-red-500"
                                )}>
                                    {overallRate.toFixed(1)}%
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">Общая посещаемость</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs defaultValue="lessons">
                        <TabsList>
                            <TabsTrigger value="lessons">По урокам</TabsTrigger>
                            <TabsTrigger value="absences">
                                Непосещения
                                {absences.length > 0 && (
                                    <span className="ml-2 bg-red-100 text-red-600 rounded-full px-2 py-0.5 text-xs">
                                        {absences.length}
                                    </span>
                                )}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="lessons">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Статистика по урокам</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {lessonStats.length === 0 ? (
                                        <p className="text-muted-foreground text-center py-6 text-sm">
                                            Нет завершённых уроков с этим волонтером.
                                        </p>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Предмет</TableHead>
                                                    <TableHead>Дата</TableHead>
                                                    <TableHead className="text-center">Всего</TableHead>
                                                    <TableHead className="text-center">Пришли</TableHead>
                                                    <TableHead className="text-center">Пропустили</TableHead>
                                                    <TableHead className="text-center">Посещаемость</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {lessonStats.map((l) => {
                                                    const rate = l.totalStudents > 0
                                                        ? (l.presentCount / l.totalStudents) * 100
                                                        : 0;
                                                    return (
                                                        <TableRow key={l.lessonId}>
                                                            <TableCell className="font-medium">{l.subjectName}</TableCell>
                                                            <TableCell className="text-sm text-muted-foreground">
                                                                {format(new Date(l.date), "d MMM yyyy, HH:mm", { locale: ru })}
                                                            </TableCell>
                                                            <TableCell className="text-center">{l.totalStudents}</TableCell>
                                                            <TableCell className="text-center text-green-600">{l.presentCount}</TableCell>
                                                            <TableCell className="text-center text-red-500">{l.absentCount}</TableCell>
                                                            <TableCell className="text-center">
                                                                <span className={cn(
                                                                    "px-2 py-0.5 rounded-full text-xs font-semibold",
                                                                    rate >= 80
                                                                        ? "bg-green-100 text-green-700"
                                                                        : rate >= 60
                                                                            ? "bg-yellow-100 text-yellow-700"
                                                                            : "bg-red-100 text-red-600"
                                                                )}>
                                                                    {rate.toFixed(0)}%
                                                                </span>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="absences">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Список непосещений</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {absences.length === 0 ? (
                                        <p className="text-muted-foreground text-center py-6 text-sm">
                                            Пропусков нет 🎉
                                        </p>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Студент</TableHead>
                                                    <TableHead>Предмет</TableHead>
                                                    <TableHead>Дата урока</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {absences.map((a, idx) => (
                                                    <TableRow key={`${a.lessonId}-${a.studentId}-${idx}`}>
                                                        <TableCell className="font-medium">{a.studentName}</TableCell>
                                                        <TableCell>{a.subjectName}</TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            {format(new Date(a.date), "d MMM yyyy, HH:mm", { locale: ru })}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </>
            )}

            {!loading && !selectedId && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                    Выберите волонтера для просмотра аналитики
                </div>
            )}
        </div>
    );
}
