"use client";

import { useActionState, useEffect, useState } from "react";
import {
    getVolunteers,
    createVolunteer,
    updateVolunteer,
    deleteVolunteer,
    Volunteer,
} from "@/app/actions/volunteers";
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

export default function VolunteersPage() {
    const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
    const [open, setOpen] = useState(false);
    const [state, formAction, isPending] = useActionState(createVolunteer, initialState);

    useEffect(() => {
        getVolunteers().then(setVolunteers);
    }, [state]);

    useEffect(() => {
        if (state.message && !state.error) {
            setOpen(false);
        }
    }, [state]);

    const refresh = () => {
        getVolunteers().then(setVolunteers);
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Волонтеры</h1>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Добавить
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Новый волонтер</DialogTitle>
                        </DialogHeader>
                        <form action={formAction} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="fullName">ФИО</Label>
                                <Input id="fullName" name="fullName" placeholder="Петров Иван Александрович" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Телефон</Label>
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
                {volunteers.map((v) => (
                    <VolunteerItem key={v._id} volunteer={v} onUpdate={refresh} />
                ))}
                {volunteers.length === 0 && (
                    <p className="text-muted-foreground text-center py-10">
                        Волонтеры не найдены. Добавьте первого.
                    </p>
                )}
            </div>
        </div>
    );
}

function VolunteerItem({ volunteer, onUpdate }: { volunteer: Volunteer; onUpdate: () => void }) {
    const [open, setOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const updateAction = updateVolunteer.bind(null, volunteer._id!);
    const [state, formAction, isPending] = useActionState(updateAction, initialState);

    useEffect(() => {
        if (state.message && !state.error) {
            setOpen(false);
            onUpdate();
        }
    }, [state, onUpdate]);

    const handleDelete = async () => {
        if (!confirm("Удалить волонтера?")) return;
        setIsDeleting(true);
        await deleteVolunteer(volunteer._id!);
        onUpdate();
        setIsDeleting(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <div className="flex flex-col">
                        <span>{volunteer.fullName}</span>
                        <span className="text-xs font-normal text-muted-foreground mt-1">
                            {volunteer.phone}
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
                                    <DialogTitle>Редактировать волонтера</DialogTitle>
                                </DialogHeader>
                                <form action={formAction} className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label>ФИО</Label>
                                        <Input name="fullName" defaultValue={volunteer.fullName} required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Телефон</Label>
                                        <Input name="phone" defaultValue={volunteer.phone} required />
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
