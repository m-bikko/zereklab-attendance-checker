"use server";

import clientPromise, { dbName } from "@/lib/db";
import { ObjectId } from "mongodb";

export interface GeneralStats {
    totalLessons: number;
    totalStudents: number;
    totalTeachers: number;
    averageAttendanceRate: number;
}

export interface TeacherStat {
    _id: string; // Teacher ID
    name: string;
    totalLessons: number;
    averageAttendance: number;
}

export interface StudentAttendanceRecord {
    lessonId: string;
    date: Date;
    subjectName: string;
    present: boolean;
}

export interface StudentStats {
    studentId: string;
    studentName: string;
    totalLessons: number;
    presentCount: number;
    absentCount: number;
    attendanceRate: number;
    history: StudentAttendanceRecord[];
}

export async function getGeneralStats(): Promise<GeneralStats> {
    const client = await clientPromise;
    const db = client.db(dbName);

    const totalLessons = await db.collection("lessons").countDocuments({ status: "completed" });
    const totalStudents = await db.collection("students").countDocuments({});
    const totalTeachers = await db.collection("teachers").countDocuments({});

    // Calculate average attendance rate across all completed lessons
    const pipeline = [
        { $match: { status: "completed" } },
        {
            $project: {
                totalStudents: { $size: "$attendance" },
                presentStudents: {
                    $size: {
                        $filter: {
                            input: "$attendance",
                            as: "att",
                            cond: { $eq: ["$$att.present", true] }
                        }
                    }
                }
            }
        },
        {
            $group: {
                _id: null,
                totalPossible: { $sum: "$totalStudents" },
                totalPresent: { $sum: "$presentStudents" }
            }
        }
    ];

    const result = await db.collection("lessons").aggregate(pipeline).toArray();
    let averageAttendanceRate = 0;

    if (result.length > 0 && result[0].totalPossible > 0) {
        averageAttendanceRate = (result[0].totalPresent / result[0].totalPossible) * 100;
    }

    return {
        totalLessons,
        totalStudents,
        totalTeachers,
        averageAttendanceRate
    };
}

export interface DailyStat {
    date: string;
    total: number;
    completed: number;
}

export async function getDailyStats(): Promise<DailyStat[]> {
    const client = await clientPromise;
    const db = client.db(dbName);

    // Get stats for last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    const pipeline = [
        {
            $match: {
                startTime: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$startTime" } },
                total: { $sum: 1 },
                completed: {
                    $sum: {
                        $cond: [{ $eq: ["$status", "completed"] }, 1, 0]
                    }
                }
            }
        },
        { $sort: { _id: 1 } }
    ];

    const result = await db.collection("lessons").aggregate(pipeline).toArray();

    // Fill in missing days
    const stats: DailyStat[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const found = result.find((r: any) => r._id === dateStr);
        stats.push({
            date: dateStr,
            total: found ? found.total : 0,
            completed: found ? found.completed : 0
        });
    }

    return stats;
}

export async function getTeacherStats(): Promise<TeacherStat[]> {
    const client = await clientPromise;
    const db = client.db(dbName);

    const pipeline = [
        { $match: { status: "completed" } },
        {
            $lookup: {
                from: "teachers",
                let: { teacherIdObj: { $toObjectId: "$teacherId" } },
                pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$teacherIdObj"] } } }
                ],
                as: "teacher"
            }
        },
        { $unwind: "$teacher" }, // Unwind to get teacher details
        {
            $project: {
                teacherId: "$teacher._id",
                teacherName: "$teacher.fullName",
                totalStudents: { $size: "$attendance" },
                presentStudents: {
                    $size: {
                        $filter: {
                            input: "$attendance",
                            as: "att",
                            cond: { $eq: ["$$att.present", true] }
                        }
                    }
                }
            }
        },
        {
            $group: {
                _id: "$teacherId",
                name: { $first: "$teacherName" },
                totalLessons: { $sum: 1 },
                totalPossible: { $sum: "$totalStudents" },
                totalPresent: { $sum: "$presentStudents" }
            }
        },
        {
            $project: {
                _id: { $toString: "$_id" },
                name: 1,
                totalLessons: 1,
                averageAttendance: {
                    $cond: [
                        { $eq: ["$totalPossible", 0] },
                        0,
                        { $multiply: [{ $divide: ["$totalPresent", "$totalPossible"] }, 100] }
                    ]
                }
            }
        },
        { $sort: { totalLessons: -1 } }
    ];

    const stats = await db.collection("lessons").aggregate(pipeline).toArray();
    return stats as TeacherStat[];
}

export async function getStudentStats(studentId: string): Promise<StudentStats | null> {
    if (!studentId) return null;

    const client = await clientPromise;
    const db = client.db(dbName);

    // 1. Get Student Info
    const student = await db.collection("students").findOne({ _id: new ObjectId(studentId) });
    if (!student) return null;

    // 2. Get Lessons where student is in attendance list
    // Note: 'attendance' is an array of objects { studentId: string, present: boolean }
    // We match lessons where attendance.studentId == studentId

    const pipeline = [
        {
            $match: {
                status: "completed",
                "attendance.studentId": studentId
            }
        },
        {
            $lookup: {
                from: "subjects",
                let: { subjectIdObj: { $toObjectId: "$subjectId" } },
                pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$subjectIdObj"] } } }
                ],
                as: "subject"
            }
        },
        { $unwind: { path: "$subject", preserveNullAndEmptyArrays: true } },
        { $sort: { startTime: -1 } },
        {
            $project: {
                startTime: 1,
                subjectName: { $ifNull: ["$subject.name", "Unknown Subject"] },
                attendanceRecord: {
                    $filter: {
                        input: "$attendance",
                        as: "att",
                        cond: { $eq: ["$$att.studentId", studentId] }
                    }
                }
            }
        }
    ];

    const lessonsRaw = await db.collection("lessons").aggregate(pipeline).toArray();

    let presentCount = 0;
    let absentCount = 0;
    const history: StudentAttendanceRecord[] = [];

    lessonsRaw.forEach((l: any) => {
        const record = l.attendanceRecord[0]; // Should exist because of match
        if (record) {
            if (record.present) presentCount++;
            else absentCount++;

            history.push({
                lessonId: l._id.toString(),
                date: l.startTime,
                subjectName: l.subjectName,
                present: record.present
            });
        }
    });

    const totalLessons = presentCount + absentCount;
    const attendanceRate = totalLessons > 0 ? (presentCount / totalLessons) * 100 : 0;

    return {
        studentId,
        studentName: student.fullName,
        totalLessons,
        presentCount,
        absentCount,
        attendanceRate,
        history
    };
}
