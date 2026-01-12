"use client";

import { useActionState, useEffect, useState, startTransition } from "react";
import { getTeachers, createTeacher, updateTeacher, deleteTeacher, Teacher } from "@/app/actions/teachers";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

const initialState = {
    message: "",
    error: false,
};

export default function TeachersPage() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [state, formAction, isPending] = useActionState(createTeacher, initialState);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        // Initial fetch
        getTeachers().then(setTeachers);
    }, [state]);

    useEffect(() => {
        if (state.message && !state.error) {
            setOpen(false);
        }
    }, [state]);

    const refreshTeachers = () => {
        getTeachers().then(setTeachers);
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Учителя</h1>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Добавить учителя
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Добавить нового учителя</DialogTitle>
                        </DialogHeader>
                        <form action={formAction} className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="fullName">ФИО</Label>
                                <Input id="fullName" name="fullName" placeholder="Иванов Иван" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Номер телефона</Label>
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
                                <Input id="password" name="password" type="password" required />
                            </div>

                            {state.message && (
                                <p className={state.error ? "text-red-500" : "text-green-500"}>
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
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {teachers.map((teacher) => (
                    <TeacherItem key={teacher._id} teacher={teacher} onUpdate={refreshTeachers} />
                ))}
                {teachers.length === 0 && (
                    <p className="text-muted-foreground col-span-2 text-center py-10">
                        Учителя не найдены. Добавьте первого учителя.
                    </p>
                )}
            </div>
        </div>
    );
}

function TeacherItem({ teacher, onUpdate }: { teacher: Teacher; onUpdate: () => void }) {
    const [open, setOpen] = useState(false);
    const updateAction = updateTeacher.bind(null, teacher._id!);
    const [state, formAction, isPending] = useActionState(updateAction, initialState);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (state.message && !state.error) {
            setOpen(false);
            onUpdate();
        }
    }, [state, onUpdate]);

    const handleDelete = async () => {
        if (!confirm("Вы уверены, что хотите удалить этого учителя?")) return;
        setIsDeleting(true);
        await deleteTeacher(teacher._id!);
        onUpdate();
        setIsDeleting(false);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {teacher.fullName}
                </CardTitle>
                <div className="flex items-center gap-2">
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Редактировать учителя</DialogTitle>
                            </DialogHeader>
                            <form action={formAction} className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="fullName">ФИО</Label>
                                    <Input
                                        id="fullName"
                                        name="fullName"
                                        defaultValue={teacher.fullName}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">Номер телефона</Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        defaultValue={teacher.phone}
                                        required
                                        onChange={(e) => {
                                            e.target.value = e.target.value.replace(/\D/g, '');
                                        }}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="password">Новый Пароль (Опционально)</Label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        placeholder="Оставьте пустым, чтобы не менять"
                                    />
                                </div>

                                {state.message && (
                                    <p className={state.error ? "text-red-500" : "text-green-500"}>
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
            </CardHeader>
            <CardContent>
                <p className="text-xs text-muted-foreground">{teacher.phone}</p>
            </CardContent>
        </Card>
    );
}
