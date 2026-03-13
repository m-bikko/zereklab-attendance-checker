"use client";

import { useActionState, useEffect, useState } from "react";
import {
    getHomeroomTeachers,
    createHomeroomTeacher,
    updateHomeroomTeacher,
    deleteHomeroomTeacher,
    getHomeroomTeacherStats,
    HomeroomTeacher,
    HomeroomStudentAttendanceStat,
} from "@/app/actions/homeroom-teachers";
import { getStudents, Student } from "@/app/actions/students";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Pencil, Loader2, Download, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

const initialState = { message: "", error: false };

export default function HomeroomTeachersPage() {
    const [homeroomTeachers, setHomeroomTeachers] = useState<HomeroomTeacher[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [open, setOpen] = useState(false);
    const [state, formAction, isPending] = useActionState(createHomeroomTeacher, initialState);

    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

    useEffect(() => {
        Promise.all([getHomeroomTeachers(), getStudents()]).then(([ht, st]) => {
            setHomeroomTeachers(ht);
            setStudents(st);
        });
    }, [state]);

    useEffect(() => {
        if (state.message && !state.error) {
            setOpen(false);
            setSelectedStudents([]);
        }
    }, [state]);

    const toggleStudent = (id: string) => {
        setSelectedStudents((prev) =>
            prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
        );
    };

    const refresh = () => {
        getHomeroomTeachers().then(setHomeroomTeachers);
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Классные руководители</h1>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Добавить
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Новый классный руководитель</DialogTitle>
                        </DialogHeader>
                        <form action={formAction} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="fullName">ФИО</Label>
                                <Input id="fullName" name="fullName" placeholder="Иванова Анна Ивановна" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Телефон</Label>
                                <Input id="phone" name="phone" placeholder="+77001234567" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Пароль</Label>
                                <Input id="password" name="password" type="password" required />
                            </div>

                            <div className="grid gap-2">
                                <Label>Прикрепить студентов</Label>
                                <ScrollArea className="h-[160px] w-full border rounded-md p-2">
                                    {students.map((s) => (
                                        <div key={s._id} className="flex items-center space-x-2 mb-2">
                                            <Checkbox
                                                id={`create-ht-st-${s._id}`}
                                                checked={selectedStudents.includes(s._id!)}
                                                onCheckedChange={() => toggleStudent(s._id!)}
                                            />
                                            <label
                                                htmlFor={`create-ht-st-${s._id}`}
                                                className="text-sm leading-none"
                                            >
                                                {s.fullName}
                                            </label>
                                        </div>
                                    ))}
                                </ScrollArea>
                                <input type="hidden" name="studentIds" value={JSON.stringify(selectedStudents)} />
                            </div>

                            {state.message && (
                                <p className={cn("text-sm", state.error ? "text-red-500" : "text-green-500")}>
                                    {state.message}
                                </p>
                            )}

                            <DialogFooter>
                                <Button type="submit" disabled={isPending}>
                                    {isPending ? "Создание..." : "Создать"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4">
                {homeroomTeachers.map((ht) => (
                    <HomeroomTeacherItem
                        key={ht._id}
                        ht={ht}
                        students={students}
                        onUpdate={refresh}
                    />
                ))}
                {homeroomTeachers.length === 0 && (
                    <p className="text-muted-foreground text-center py-10">
                        Классные руководители не найдены. Добавьте первого.
                    </p>
                )}
            </div>
        </div>
    );
}

function HomeroomTeacherItem({
    ht,
    students,
    onUpdate,
}: {
    ht: HomeroomTeacher;
    students: Student[];
    onUpdate: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [statsOpen, setStatsOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [stats, setStats] = useState<HomeroomStudentAttendanceStat[]>([]);
    const [loadingStats, setLoadingStats] = useState(false);

    const updateAction = updateHomeroomTeacher.bind(null, ht._id!);
    const [state, formAction, isPending] = useActionState(updateAction, initialState);
    const [selectedStudents, setSelectedStudents] = useState<string[]>(ht.studentIds || []);

    useEffect(() => {
        if (state.message && !state.error) {
            setOpen(false);
            onUpdate();
        }
    }, [state, onUpdate]);

    const toggleStudent = (id: string) => {
        setSelectedStudents((prev) =>
            prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
        );
    };

    const handleDelete = async () => {
        if (!confirm("Удалить классного руководителя?")) return;
        setIsDeleting(true);
        await deleteHomeroomTeacher(ht._id!);
        onUpdate();
        setIsDeleting(false);
    };

    const loadStats = async () => {
        setLoadingStats(true);
        const data = await getHomeroomTeacherStats(ht._id!);
        setStats(data);
        setLoadingStats(false);
        setStatsOpen(true);
    };

    const downloadCSV = () => {
        const headers = ["Студент", "Всего уроков", "Присутствовал", "Отсутствовал", "Посещаемость (%)"];
        const rows = stats.map((s) => [
            s.studentName,
            s.totalLessons,
            s.presentCount,
            s.absentCount,
            s.attendanceRate.toFixed(1),
        ]);
        const csvContent = [headers, ...rows].map((r) => r.join(";")).join("\n");
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `посещаемость_${ht.fullName.replace(/ /g, "_")}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const attachedStudents = students.filter((s) => ht.studentIds?.includes(s._id!));

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        <div className="flex flex-col">
                            <span>{ht.fullName}</span>
                            <span className="text-xs font-normal text-muted-foreground mt-1">
                                {ht.phone} · {ht.studentIds?.length || 0} студентов
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={loadStats}>
                                <BarChart2 className="h-4 w-4 mr-1" />
                                Посещаемость
                            </Button>

                            {/* Edit */}
                            <Dialog open={open} onOpenChange={setOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>Редактировать</DialogTitle>
                                    </DialogHeader>
                                    <form action={formAction} className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label>ФИО</Label>
                                            <Input name="fullName" defaultValue={ht.fullName} required />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Телефон</Label>
                                            <Input name="phone" defaultValue={ht.phone} required />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Новый пароль (оставьте пустым чтобы не менять)</Label>
                                            <Input name="password" type="password" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Студенты</Label>
                                            <ScrollArea className="h-[160px] w-full border rounded-md p-2">
                                                {students.map((s) => (
                                                    <div key={s._id} className="flex items-center space-x-2 mb-2">
                                                        <Checkbox
                                                            id={`edit-ht-st-${ht._id}-${s._id}`}
                                                            checked={selectedStudents.includes(s._id!)}
                                                            onCheckedChange={() => toggleStudent(s._id!)}
                                                        />
                                                        <label
                                                            htmlFor={`edit-ht-st-${ht._id}-${s._id}`}
                                                            className="text-sm"
                                                        >
                                                            {s.fullName}
                                                        </label>
                                                    </div>
                                                ))}
                                            </ScrollArea>
                                            <input type="hidden" name="studentIds" value={JSON.stringify(selectedStudents)} />
                                        </div>
                                        {state.message && (
                                            <p className={cn("text-sm", state.error ? "text-red-500" : "text-green-500")}>
                                                {state.message}
                                            </p>
                                        )}
                                        <DialogFooter>
                                            <Button type="submit" disabled={isPending}>
                                                {isPending ? "Сохранение..." : "Сохранить"}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-600"
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                        </div>
                    </CardTitle>
                </CardHeader>
                {attachedStudents.length > 0 && (
                    <CardContent>
                        <div className="flex flex-wrap gap-1">
                            {attachedStudents.map((s) => (
                                <span key={s._id} className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">
                                    {s.fullName}
                                </span>
                            ))}
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Stats dialog */}
            <Dialog open={statsOpen} onOpenChange={setStatsOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Посещаемость — {ht.fullName}</DialogTitle>
                    </DialogHeader>
                    {loadingStats ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : stats.length === 0 ? (
                        <p className="text-muted-foreground text-center py-6">
                            Данных о посещаемости пока нет.
                        </p>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Студент</TableHead>
                                        <TableHead className="text-center">Уроков</TableHead>
                                        <TableHead className="text-center">Присутствовал</TableHead>
                                        <TableHead className="text-center">Пропустил</TableHead>
                                        <TableHead className="text-center">Посещаемость</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stats.map((s) => (
                                        <TableRow key={s.studentId}>
                                            <TableCell>{s.studentName}</TableCell>
                                            <TableCell className="text-center">{s.totalLessons}</TableCell>
                                            <TableCell className="text-center text-green-600">{s.presentCount}</TableCell>
                                            <TableCell className="text-center text-red-500">{s.absentCount}</TableCell>
                                            <TableCell className="text-center font-semibold">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-full text-xs",
                                                    s.attendanceRate >= 80
                                                        ? "bg-green-100 text-green-700"
                                                        : s.attendanceRate >= 60
                                                            ? "bg-yellow-100 text-yellow-700"
                                                            : "bg-red-100 text-red-600"
                                                )}>
                                                    {s.attendanceRate.toFixed(1)}%
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="flex justify-end mt-4">
                                <Button onClick={downloadCSV} variant="outline">
                                    <Download className="h-4 w-4 mr-2" />
                                    Скачать CSV
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
