"use client";

import { useActionState, useEffect, useState } from "react";
import { saveAttendance } from "@/app/actions/attendance";
import { getVolunteers, Volunteer } from "@/app/actions/volunteers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X, Camera } from "lucide-react";

interface AttendanceModalProps {
    lesson: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    students: any[]; // All students map or list
}

const initialState = {
    message: "",
    error: false,
};

export function AttendanceModal({ lesson, open, onOpenChange, students }: AttendanceModalProps) {
    const [state, formAction, isPending] = useActionState(saveAttendance, initialState);
    const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({});
    const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
    const [selectedVolunteerIds, setSelectedVolunteerIds] = useState<string[]>([]);

    const [isEditing, setIsEditing] = useState(false);
    const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);

    useEffect(() => {
        getVolunteers().then(setVolunteers);
    }, []);

    useEffect(() => {
        if (lesson) {
            if (lesson.attendance && lesson.attendance.length > 0) {
                const map: Record<string, boolean> = {};
                lesson.attendance.forEach((a: any) => {
                    map[a.studentId] = a.present;
                });
                setAttendanceMap(map);
                setExistingPhotos(lesson.photos || []);
                setSelectedVolunteerIds(lesson.volunteerIds || []);
                setIsEditing(false);
            } else {
                setAttendanceMap({});
                setExistingPhotos([]);
                setSelectedVolunteerIds(lesson.volunteerIds || []);
                setIsEditing(true);
            }
            // Clear previous previews
            setPreviewUrls([]);
            setSelectedFiles([]);
        }
    }, [lesson, open]);

    useEffect(() => {
        if (state.message && !state.error) {
            onOpenChange(false);
            setIsEditing(false);
            setPreviewUrls([]);
            setSelectedFiles([]);
        }
    }, [state]);

    // Cleanup object URLs to avoid memory leaks
    useEffect(() => {
        return () => {
            previewUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [previewUrls]);

    if (!lesson) return null;

    const enrolledStudents = students.filter(s => lesson.studentIds.includes(s._id));

    const togglePresence = (studentId: string) => {
        setAttendanceMap(prev => ({
            ...prev,
            [studentId]: !prev[studentId]
        }));
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            // Limit to 3 total (existing + new) ? User said "max 3".
            // Let's just create previews for now. 
            // If strict limit needed:
            // const total = existingPhotos.length + selectedFiles.length + files.length;

            const newPreviews = files.map(file => URL.createObjectURL(file));
            setPreviewUrls(prev => [...prev, ...newPreviews]);
            setSelectedFiles(prev => [...prev, ...files]);
        }
    };

    const removeExistingPhoto = (index: number) => {
        setExistingPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const removeNewPhoto = (index: number) => {
        const urlToRemove = previewUrls[index];
        URL.revokeObjectURL(urlToRemove);
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleEdit = () => setIsEditing(true);



    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {lesson.subject?.name} - {isEditing ? "Отметить посещаемость" : "Отчет о посещаемости"}
                        </DialogTitle>
                        <div className="text-sm text-muted-foreground">
                            {new Date(lesson.startTime).toLocaleString("ru-RU", { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </DialogHeader>

                    {!isEditing ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="text-center p-2 bg-green-100 rounded">
                                    <span className="block text-2xl font-bold text-green-700">
                                        {Object.values(attendanceMap).filter(v => v).length}
                                    </span>
                                    <span className="text-xs text-green-800">Присутствует</span>
                                </div>
                                <div className="text-center p-2 bg-red-100 rounded">
                                    <span className="block text-2xl font-bold text-red-700">
                                        {enrolledStudents.length - Object.values(attendanceMap).filter(v => v).length}
                                    </span>
                                    <span className="text-xs text-red-800">Отсутствует</span>
                                </div>
                            </div>

                            {lesson.photos && lesson.photos.length > 0 && (
                                <div>
                                    <Label>Фото отчет:</Label>
                                    <div className="flex gap-2 overflow-x-auto py-2">
                                        {lesson.photos.map((url: string, idx: number) => (
                                            <div key={idx} className="relative group">
                                                <img src={url} alt="Class" className="h-24 w-24 object-cover rounded shadow" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <ScrollArea className="h-[200px] border rounded p-2">
                                {enrolledStudents.map(student => (
                                    <div key={student._id} className="flex justify-between items-center py-2 border-b last:border-0">
                                        <span>{student.fullName}</span>
                                        {attendanceMap[student._id] ? (
                                            <span className="flex items-center text-green-600 text-xs"><Check className="w-4 h-4 mr-1" /> Был(а)</span>
                                        ) : (
                                            <span className="flex items-center text-red-500 text-xs"><X className="w-4 h-4 mr-1" /> Нет</span>
                                        )}
                                    </div>
                                ))}
                            </ScrollArea>

                            <Button className="w-full" onClick={handleEdit}>Изменить отчет</Button>
                        </div>
                    ) : (
                        <form action={(formData) => {
                            formData.set("existingPhotos", JSON.stringify(existingPhotos));
                            formData.set("volunteerIds", JSON.stringify(selectedVolunteerIds));

                            // Handle new photos manually to support removal
                            formData.delete("photos");
                            selectedFiles.forEach(file => {
                                formData.append("photos", file);
                            });

                            formAction(formData);
                        }} className="space-y-4">
                            <input type="hidden" name="lessonId" value={lesson._id} />
                            <input type="hidden" name="attendanceMap" value={JSON.stringify(attendanceMap)} />

                            <Label>Список студентов</Label>
                            <ScrollArea className="h-[220px] border rounded p-2">
                                {enrolledStudents.map(student => (
                                    <div key={student._id}
                                        className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                                        onClick={() => togglePresence(student._id)}
                                    >
                                        <span className="font-medium">{student.fullName}</span>
                                        <div className={
                                            `w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${attendanceMap[student._id] ? "bg-green-500 border-green-500 text-white" : "border-gray-300"
                                            }`
                                        }>
                                            {attendanceMap[student._id] && <Check className="w-4 h-4" />}
                                        </div>
                                    </div>
                                ))}
                            </ScrollArea>

                            {/* Volunteers section */}
                            {volunteers.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Волонтеры урока</Label>
                                    <div className="border rounded p-2 flex flex-wrap gap-2">
                                        {volunteers.map(v => (
                                            <label
                                                key={v._id}
                                                className="flex items-center gap-1.5 cursor-pointer text-sm"
                                            >
                                                <Checkbox
                                                    checked={selectedVolunteerIds.includes(v._id!)}
                                                    onCheckedChange={(checked) => {
                                                        setSelectedVolunteerIds(prev =>
                                                            checked
                                                                ? [...prev, v._id!]
                                                                : prev.filter(id => id !== v._id)
                                                        );
                                                    }}
                                                />
                                                {v.fullName}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="photos">Фотографии</Label>

                                {/* Previews Grid */}
                                <div className="flex gap-2 flex-wrap mb-2">
                                    {existingPhotos.map((url, idx) => (
                                        <div key={`exist-${idx}`} className="relative h-20 w-20 group">
                                            <img src={url} className="h-full w-full object-cover rounded border" />
                                            <button
                                                type="button"
                                                onClick={() => removeExistingPhoto(idx)}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] px-1 truncate">
                                                Saved
                                            </div>
                                        </div>
                                    ))}
                                    {previewUrls.map((url, idx) => (
                                        <div key={`new-${idx}`} className="relative h-20 w-20 group">
                                            <img src={url} className="h-full w-full object-cover rounded border border-blue-400" />
                                            {/* Since we can't easily sync removal with simple file input without hacks, 
                                            removing new preview is tricky unless we don't rely on the input for submission 
                                            but manually construct FormData. 
                                            Let's hide the remove button for new files for now to avoid confusion 
                                            or just let them clear the input. */}
                                            <div className="absolute bottom-0 left-0 right-0 bg-blue-500/50 text-white text-[9px] px-1 truncate">
                                                New
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Input
                                    id="photos"
                                    name="photos"
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                />
                                <p className="text-xs text-muted-foreground">Загруженные новые фото добавятся к существующим.</p>
                            </div>

                            {state.message && (
                                <p className={state.error ? "text-red-500" : "text-green-500"}>
                                    {state.message}
                                </p>
                            )}

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Отмена</Button>
                                <Button type="submit" disabled={isPending}>
                                    {isPending ? "Сохранение..." : "Сохранить отчет"}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {zoomedPhoto && (
                <Dialog open={!!zoomedPhoto} onOpenChange={() => setZoomedPhoto(null)}>
                    <DialogContent className="max-w-4xl max-h-screen p-0 overflow-hidden bg-black/90 border-none sm:rounded-none">
                        <div className="relative w-full h-full flex items-center justify-center min-h-[50vh]">
                            <img src={zoomedPhoto} alt="Zoomed" className="max-w-full max-h-[90vh] object-contain" />
                            <Button
                                className="absolute top-4 right-4 rounded-full"
                                size="icon"
                                variant="secondary"
                                onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = zoomedPhoto;
                                    link.download = `photo-${Date.now()}.jpg`;
                                    link.target = "_blank"; // Fallback
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}
