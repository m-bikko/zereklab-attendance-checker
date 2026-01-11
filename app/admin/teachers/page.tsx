"use client";

import { useActionState, useEffect, useState } from "react";
import { getTeachers, createTeacher, Teacher } from "@/app/actions/teachers";
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

export default function TeachersPage() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [state, formAction, isPending] = useActionState(createTeacher, initialState);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        // Initial fetch
        getTeachers().then(setTeachers);
    }, [state]); // Re-fetch when action completes

    useEffect(() => {
        if (state.message && !state.error) {
            setOpen(false); // Close modal on success
        }
    }, [state]);

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
                    <Card key={teacher._id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {teacher.fullName}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">{teacher.phone}</p>
                        </CardContent>
                    </Card>
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
