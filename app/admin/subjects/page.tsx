"use client";

import { useActionState, useEffect, useState, startTransition } from "react";
import { getSubjects, createSubject, updateSubject, deleteSubject, Subject, ScheduleRule } from "@/app/actions/subjects";
import { getTeachers, Teacher } from "@/app/actions/teachers";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, CalendarIcon, Trash2, Pencil, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const initialState = {
    message: "",
    error: false,
};

const DAYS = [
    { value: 0, label: "Воскресенье" },
    { value: 1, label: "Понедельник" },
    { value: 2, label: "Вторник" },
    { value: 3, label: "Среда" },
    { value: 4, label: "Четверг" },
    { value: 5, label: "Пятница" },
    { value: 6, label: "Суббота" },
];

export default function SubjectsPage() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [students, setStudents] = useState<Student[]>([]);

    const [open, setOpen] = useState(false);
    const [state, formAction, isPending] = useActionState(createSubject, initialState);

    // Form State
    const [selectedTeacher, setSelectedTeacher] = useState<string>("");
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [schedule, setSchedule] = useState<ScheduleRule[]>([]);
    const [startDate, setStartDate] = useState<Date | undefined>(new Date());
    const [endDate, setEndDate] = useState<Date | undefined>();

    // Temporary schedule rule state
    const [tempDay, setTempDay] = useState<string>("1");
    const [tempStart, setTempStart] = useState("09:00");
    const [tempEnd, setTempEnd] = useState("10:00");

    useEffect(() => {
        Promise.all([getSubjects(), getTeachers(), getStudents()])
            .then(([sub, teach, stud]) => {
                setSubjects(sub as any);
                setTeachers(teach);
                setStudents(stud);
            });
    }, [state]);

    useEffect(() => {
        if (state.message && !state.error) {
            setOpen(false);
            // Reset form
            setSelectedTeacher("");
            setSelectedStudents([]);
            setSchedule([]);
            setEndDate(undefined);
        }
    }, [state]);

    const addScheduleRule = () => {
        setSchedule([
            ...schedule,
            {
                dayOfWeek: parseInt(tempDay),
                startTime: tempStart,
                endTime: tempEnd,
            },
        ]);
    };

    const removeScheduleRule = (index: number) => {
        const newSchedule = [...schedule];
        newSchedule.splice(index, 1);
        setSchedule(newSchedule);
    };

    const toggleStudent = (id: string) => {
        setSelectedStudents((prev) =>
            prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
        );
    };

    const refreshSubjects = () => {
        getSubjects().then(res => setSubjects(res as any));
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Предметы</h1>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Создать предмет
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Создать новый предмет</DialogTitle>
                        </DialogHeader>
                        <form action={formAction} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Название предмета</Label>
                                <Input id="name" name="name" placeholder="Математика" required />
                            </div>

                            <div className="grid gap-2">
                                <Label>Учитель</Label>
                                <Select name="teacherId" onValueChange={setSelectedTeacher} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Выберите учителя" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {teachers.map((t) => (
                                            <SelectItem key={t._id} value={t._id!}>
                                                {t.fullName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <input type="hidden" name="teacherId" value={selectedTeacher} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Студенты</Label>
                                <ScrollArea className="h-[150px] w-full border rounded-md p-2">
                                    {students.map((student) => (
                                        <div key={student._id} className="flex items-center space-x-2 mb-2">
                                            <Checkbox
                                                id={`student-${student._id}`}
                                                checked={selectedStudents.includes(student._id!)}
                                                onCheckedChange={() => toggleStudent(student._id!)}
                                            />
                                            <label
                                                htmlFor={`student-${student._id}`}
                                                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                {student.fullName}
                                            </label>
                                        </div>
                                    ))}
                                </ScrollArea>
                                <input type="hidden" name="studentIds" value={JSON.stringify(selectedStudents)} />
                            </div>

                            <div className="space-y-2 border p-3 rounded-md">
                                <Label className="font-bold">Расписание</Label>
                                <div className="flex flex-wrap gap-2 items-end">
                                    <div className="grid gap-1 flex-1">
                                        <Label className="text-xs">День</Label>
                                        <Select value={tempDay} onValueChange={setTempDay}>
                                            <SelectTrigger className="h-8">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DAYS.map(d => (
                                                    <SelectItem key={d.value} value={d.value.toString()}>{d.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-1 w-24">
                                        <Label className="text-xs">Начало</Label>
                                        <Input className="h-8" type="time" value={tempStart} onChange={e => setTempStart(e.target.value)} />
                                    </div>
                                    <div className="grid gap-1 w-24">
                                        <Label className="text-xs">Конец</Label>
                                        <Input className="h-8" type="time" value={tempEnd} onChange={e => setTempEnd(e.target.value)} />
                                    </div>
                                    <Button type="button" size="sm" onClick={addScheduleRule}>Добавить</Button>
                                </div>

                                <div className="flex flex-wrap gap-2 mt-2">
                                    {schedule.map((rule, idx) => (
                                        <div key={idx} className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-md flex items-center gap-2">
                                            <span>{DAYS[rule.dayOfWeek].label} {rule.startTime}-{rule.endTime}</span>
                                            <button type="button" onClick={() => removeScheduleRule(idx)} className="text-red-500">
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <input type="hidden" name="schedule" value={JSON.stringify(schedule)} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Дата начала</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn("pl-3 text-left font-normal", !startDate && "text-muted-foreground")}>
                                                {startDate ? format(startDate, "PPP") : <span>Выберите дату</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                    <input type="hidden" name="startDate" value={startDate?.toISOString() || ""} />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Дата окончания</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn("pl-3 text-left font-normal", !endDate && "text-muted-foreground")}>
                                                {endDate ? format(endDate, "PPP") : <span>Выберите дату</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={endDate} onSelect={setEndDate} disabled={(date) => date < (startDate || new Date())} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                    <input type="hidden" name="periodicityEndDate" value={endDate?.toISOString() || ""} />
                                </div>
                            </div>

                            {state.message && (
                                <p className={cn("text-sm", state.error ? "text-red-500" : "text-green-500")}>
                                    {state.message}
                                </p>
                            )}

                            <DialogFooter>
                                <Button type="submit" disabled={isPending || schedule.length === 0 || selectedStudents.length === 0 || !endDate}>
                                    {isPending ? "Создание..." : "Создать предмет"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4">
                {subjects.map((subject) => (
                    <SubjectItem key={subject._id} subject={subject} teachers={teachers} students={students} onUpdate={refreshSubjects} />
                ))}
                {subjects.length === 0 && (
                    <p className="text-muted-foreground text-center py-10">
                        Предметы не найдены. Создайте предмет для генерации расписания.
                    </p>
                )}
            </div>
        </div>
    );
}

function SubjectItem({ subject, teachers, students, onUpdate }: { subject: Subject; teachers: Teacher[]; students: Student[]; onUpdate: () => void }) {
    const [open, setOpen] = useState(false);
    const updateAction = updateSubject.bind(null, subject._id!);
    const [state, formAction, isPending] = useActionState(updateAction, initialState);
    const [isDeleting, setIsDeleting] = useState(false);

    // Initial State
    const [selectedTeacher, setSelectedTeacher] = useState<string>(subject.teacherId);
    const [selectedStudents, setSelectedStudents] = useState<string[]>(subject.studentIds || []);

    const toggleStudent = (id: string) => {
        setSelectedStudents((prev) =>
            prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
        );
    };

    useEffect(() => {
        if (state.message && !state.error) {
            setOpen(false);
            onUpdate();
        }
    }, [state, onUpdate]);

    const handleDelete = async () => {
        if (!confirm("Вы уверены, что хотите удалить этот предмет? Все будущие уроки будут удалены.")) return;
        setIsDeleting(true);
        await deleteSubject(subject._id!);
        onUpdate();
        setIsDeleting(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <div className="flex flex-col">
                        <span>{subject.name}</span>
                        <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded w-fit mt-1">
                            {teachers.find(t => t._id === subject.teacherId)?.fullName}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Редактировать предмет</DialogTitle>
                                </DialogHeader>
                                <form action={formAction} className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Название предмета</Label>
                                        <Input id="name" name="name" defaultValue={subject.name} required />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Учитель</Label>
                                        <Select name="teacherId" defaultValue={selectedTeacher} onValueChange={setSelectedTeacher} required>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Выберите учителя" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {teachers.map((t) => (
                                                    <SelectItem key={t._id} value={t._id!}>
                                                        {t.fullName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <input type="hidden" name="teacherId" value={selectedTeacher} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Студенты</Label>
                                        <ScrollArea className="h-[150px] w-full border rounded-md p-2">
                                            {students.map((student) => (
                                                <div key={student._id} className="flex items-center space-x-2 mb-2">
                                                    <Checkbox
                                                        id={`edit-sub-st-${subject._id}-${student._id}`}
                                                        checked={selectedStudents.includes(student._id!)}
                                                        onCheckedChange={() => toggleStudent(student._id!)}
                                                    />
                                                    <label
                                                        htmlFor={`edit-sub-st-${subject._id}-${student._id}`}
                                                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                    >
                                                        {student.fullName}
                                                    </label>
                                                </div>
                                            ))}
                                        </ScrollArea>
                                        <input type="hidden" name="studentIds" value={JSON.stringify(selectedStudents)} />
                                    </div>

                                    <div className="rounded-md bg-muted p-2 text-sm text-muted-foreground">
                                        <p>Примечание: Изменение расписания в режиме редактирования пока недоступно. Для изменения расписания создайте новый предмет.</p>
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
            <CardContent>
                <div className="text-sm text-muted-foreground">
                    <p>Расписание: {subject.schedule.map(s => `${DAYS[s.dayOfWeek].label.substring(0, 3)} ${s.startTime}`).join(", ")}</p>
                    <p>Студенты: {subject.studentIds.length} зачислено</p>
                </div>
            </CardContent>
        </Card>
    );
}
