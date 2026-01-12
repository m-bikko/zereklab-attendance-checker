"use client";

import { useActionState, useEffect, useState, startTransition } from "react";
import { getParents, createParent, updateParent, deleteParent, Parent } from "@/app/actions/parents";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

const initialState = {
    message: "",
    error: false,
};

export default function ParentsPage() {
    const [parents, setParents] = useState<Parent[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [open, setOpen] = useState(false);
    const [state, formAction, isPending] = useActionState(createParent, initialState);
    const [showPassword, setShowPassword] = useState(false);

    // Form State
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

    useEffect(() => {
        Promise.all([getParents(), getStudents()])
            .then(([p, s]) => {
                setParents(p);
                setStudents(s);
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

    const refreshParents = () => {
        getParents().then(setParents);
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Родители</h1>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Добавить родителя
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Добавить родителя</DialogTitle>
                        </DialogHeader>
                        <form action={formAction} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="fullName">ФИО Родителя</Label>
                                <Input id="fullName" name="fullName" placeholder="Иванов Иван" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Номер телефона (Логин)</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    placeholder="87771234567"
                                    required
                                    onChange={(e) => {
                                        e.target.value = e.target.value.replace(/\D/g, '');
                                    }}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Пароль</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>Дети (Студенты)</Label>
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
                {parents.map((parent) => (
                    <ParentItem key={parent._id} parent={parent} students={students} onUpdate={refreshParents} />
                ))}
                {parents.length === 0 && (
                    <p className="text-muted-foreground text-center py-10">
                        Родители не найдены.
                    </p>
                )}
            </div>
        </div>
    );
}

function ParentItem({ parent, students, onUpdate }: { parent: Parent; students: Student[]; onUpdate: () => void }) {
    const [open, setOpen] = useState(false);
    const updateAction = updateParent.bind(null, parent._id!);
    const [state, formAction, isPending] = useActionState(updateAction, initialState);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Initial selection
    const [selectedStudents, setSelectedStudents] = useState<string[]>(parent.studentIds || []);

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
        if (!confirm("Вы уверены, что хотите удалить этого родителя?")) return;
        setIsDeleting(true);
        await deleteParent(parent._id!);
        onUpdate();
        setIsDeleting(false);
    };

    return (
        <Card>
            <CardHeader className="py-4">
                <CardTitle className="text-lg flex justify-between items-center">
                    <div className="flex flex-col">
                        <span>{parent.fullName}</span>
                        <span className="text-sm font-normal text-muted-foreground">{parent.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>Редактировать родителя</DialogTitle>
                                </DialogHeader>
                                <form action={formAction} className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="fullName">ФИО Родителя</Label>
                                        <Input id="fullName" name="fullName" defaultValue={parent.fullName} required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">Номер телефона (Логин)</Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            defaultValue={parent.phone}
                                            required
                                            onChange={(e) => {
                                                e.target.value = e.target.value.replace(/\D/g, '');
                                            }}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password">Новый Пароль (Опционально)</Label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Оставьте пустым, чтобы не менять"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Дети (Студенты)</Label>
                                        <ScrollArea className="h-[150px] w-full border rounded-md p-2">
                                            {students.map((student) => (
                                                <div key={student._id} className="flex items-center space-x-2 mb-2">
                                                    <Checkbox
                                                        id={`edit-student-${parent._id}-${student._id}`}
                                                        checked={selectedStudents.includes(student._id!)}
                                                        onCheckedChange={() => toggleStudent(student._id!)}
                                                    />
                                                    <label
                                                        htmlFor={`edit-student-${parent._id}-${student._id}`}
                                                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                    >
                                                        {student.fullName}
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
            <CardContent className="pb-4 pt-0">
                <p className="text-sm text-muted-foreground">
                    Дети: {parent.studentIds.length > 0
                        ? parent.studentIds.map(id => students.find(s => s._id === id)?.fullName).filter(Boolean).join(", ")
                        : "Нет прикрепленных детей"}
                </p>
            </CardContent>
        </Card>
    );
}
