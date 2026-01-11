"use client";

import { useActionState, useEffect, useState } from "react";
import { getStudents, createStudent, Student } from "@/app/actions/students";
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
import { Plus } from "lucide-react";

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
    }, [state]);

    useEffect(() => {
        if (state.message && !state.error) {
            setOpen(false);
        }
    }, [state]);

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
                    <Card key={student._id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {student.fullName}
                            </CardTitle>
                        </CardHeader>
                    </Card>
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
