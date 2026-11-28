export type SessionMode = "Online" | "Offline";
export type SessionStatus = "Scheduled" | "Completed" | "Cancelled";
export type AttendanceStatus = "Present" | "Late" | "Absent" | "Excused";
export type ClassStatus = "Draft" | "Active" | "Completed" | "Archived";

export interface StudentUpcomingSession {
  sessionId: string;
  classId: string;
  classCode: string;
  className: string;
  title: string;
  startAt: string;
  endAt: string;
  mode: SessionMode;
  roomName: string | null;
  teacherName: string | null;
  status: SessionStatus;
}

export interface StudentAttendanceSummary {
  totalRecorded: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount: number;
}

export interface StudentEnrolledClassSummary {
  classId: string;
  code: string;
  name: string;
  status: ClassStatus;
  startDate: string | null;
  endDate: string | null;
  teacherName: string | null;
  defaultRoomName: string | null;
}

export interface StudentPortalOverview {
  studentId: string;
  enrolledClasses: StudentEnrolledClassSummary[];
  upcomingSessions: StudentUpcomingSession[];
  attendanceSummary: StudentAttendanceSummary;
}

export interface StudentSessionWorkspace {
  sessionId: string;
  title: string;
  startAt: string;
  endAt: string;
  mode: SessionMode;
  roomName: string | null;
  teacherName: string | null;
  status: SessionStatus;
  myAttendanceStatus: AttendanceStatus | null;
  myAttendanceNote: string | null;
}

export interface StudentClassSchedule {
  scheduleId: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  mode: SessionMode;
  effectiveFrom: string;
  effectiveTo: string;
}

export interface ClassroomWorkspace {
  classId: string;
  code: string;
  name: string;
  description: string | null;
  status: ClassStatus;
  startDate: string | null;
  endDate: string | null;
  teacherName: string | null;
  defaultRoomName: string | null;
  schedules: StudentClassSchedule[];
  sessions: StudentSessionWorkspace[];
}
