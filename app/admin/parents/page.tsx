"use client";

import { useActionState, useEffect, useState } from "react";
import { getParents, createParent, Parent } from "@/app/actions/parents";
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
import { Plus } from "lucide-react";
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
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye-off"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                                        )}
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
                    <Card key={parent._id}>
                        <CardHeader className="py-4">
                            <CardTitle className="text-lg flex justify-between">
                                <span>{parent.fullName}</span>
                                <span className="text-sm font-normal text-muted-foreground">{parent.phone}</span>
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
