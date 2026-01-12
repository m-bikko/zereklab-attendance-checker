"use client";

import { useActionState, useEffect, useState, startTransition } from "react";
import { getStudents, createStudent, updateStudent, deleteStudent, Student } from "@/app/actions/students";
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
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

const initialState = {
    message: "",
    error: false,
};

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [state, formAction, isPending] = useActionState(createStudent, initialState);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        // Initial fetch
        getStudents().then(setStudents);
    }, [state]); // Re-fetch when create action completes

    useEffect(() => {
        if (state.message && !state.error) {
            setOpen(false);
        }
    }, [state]);

    // Handler for updates/deletes from children to refresh list
    const refreshStudents = () => {
        getStudents().then(setStudents);
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Студенты</h1>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Добавить студента
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Добавить нового студента</DialogTitle>
                        </DialogHeader>
                        <form action={formAction} className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="fullName">ФИО</Label>
                                <Input id="fullName" name="fullName" placeholder="Иванов Иван" required />
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
                {students.map((student) => (
                    <StudentItem key={student._id} student={student} onUpdate={refreshStudents} />
                ))}
                {students.length === 0 && (
                    <p className="text-muted-foreground col-span-2 text-center py-10">
                        Студенты не найдены. Добавьте первого студента.
                    </p>
                )}
            </div>
        </div>
    );
}

function StudentItem({ student, onUpdate }: { student: Student; onUpdate: () => void }) {
    const [open, setOpen] = useState(false);
    const updateAction = updateStudent.bind(null, student._id!);
    const [state, formAction, isPending] = useActionState(updateAction, initialState);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (state.message && !state.error) {
            setOpen(false);
            onUpdate();
        }
    }, [state, onUpdate]);

    const handleDelete = async () => {
        if (!confirm("Вы уверены, что хотите удалить этого студента?")) return;
        setIsDeleting(true);
        await deleteStudent(student._id!);
        onUpdate();
        setIsDeleting(false);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {student.fullName}
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
                                <DialogTitle>Редактировать студента</DialogTitle>
                            </DialogHeader>
                            <form action={formAction} className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="fullName">ФИО</Label>
                                    <Input
                                        id="fullName"
                                        name="fullName"
                                        defaultValue={student.fullName}
                                        required
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
        </Card>
    );
}
