"use client";

import { useActionState, useEffect, useState } from "react";
import {
    getAnalysts,
    createAnalyst,
    updateAnalyst,
    deleteAnalyst,
    Analyst,
} from "@/app/actions/analysts";
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
import { Plus, Trash2, Pencil, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const initialState = { message: "", error: false };

export default function AnalystsPage() {
    const [analysts, setAnalysts] = useState<Analyst[]>([]);
    const [open, setOpen] = useState(false);
    const [state, formAction, isPending] = useActionState(createAnalyst, initialState);

    useEffect(() => {
        getAnalysts().then(setAnalysts);
    }, [state]);

    useEffect(() => {
        if (state.message && !state.error) {
            setOpen(false);
        }
    }, [state]);

    const refresh = () => {
        getAnalysts().then(setAnalysts);
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Аналитики</h1>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Добавить
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Новый аналитик</DialogTitle>
                        </DialogHeader>
                        <form action={formAction} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="fullName">ФИО</Label>
                                <Input id="fullName" name="fullName" placeholder="Петров Иван Александрович" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Телефон (логин)</Label>
                                <Input id="phone" name="phone" placeholder="+77001234567" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Пароль</Label>
                                <Input id="password" name="password" type="password" required />
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
                {analysts.map((a) => (
                    <AnalystItem key={a._id} analyst={a} onUpdate={refresh} />
                ))}
                {analysts.length === 0 && (
                    <p className="text-muted-foreground text-center py-10">
                        Аналитики не найдены. Добавьте первого.
                    </p>
                )}
            </div>
        </div>
    );
}

function AnalystItem({ analyst, onUpdate }: { analyst: Analyst; onUpdate: () => void }) {
    const [open, setOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const updateAction = updateAnalyst.bind(null, analyst._id!);
    const [state, formAction, isPending] = useActionState(updateAction, initialState);

    useEffect(() => {
        if (state.message && !state.error) {
            setOpen(false);
            onUpdate();
        }
    }, [state, onUpdate]);

    const handleDelete = async () => {
        if (!confirm("Удалить аналитика?")) return;
        setIsDeleting(true);
        await deleteAnalyst(analyst._id!);
        onUpdate();
        setIsDeleting(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <div className="flex flex-col">
                        <span>{analyst.fullName}</span>
                        <span className="text-xs font-normal text-muted-foreground mt-1">
                            {analyst.phone}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Редактировать аналитика</DialogTitle>
                                </DialogHeader>
                                <form action={formAction} className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label>ФИО</Label>
                                        <Input name="fullName" defaultValue={analyst.fullName} required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Телефон (логин)</Label>
                                        <Input name="phone" defaultValue={analyst.phone} required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Новый пароль (оставьте пустым чтобы не менять)</Label>
                                        <Input name="password" type="password" />
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
        </Card>
    );
}
