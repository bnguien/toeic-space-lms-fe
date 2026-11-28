import { useState } from "react";
import { isAxiosError } from "axios";
import { CalendarDays, ClipboardList, GraduationCap, MapPin, Video } from "lucide-react";
import { SessionMeetSection } from "@/modules/teacher";
import type { SessionView } from "@/modules/admin";
import { useClassroomWorkspace } from "../hooks/useStudentWorkspace";
import { StudentAttendanceHistory } from "./StudentAttendanceHistory";
import type {
  ClassStatus,
  SessionMode,
  SessionStatus,
  AttendanceStatus,
  StudentSessionWorkspace,
  StudentClassSchedule,
} from "../types/student-workspace.types";
import styles from "./ClassroomWorkspace.module.css";

type WorkspaceTab = "overview" | "sessions" | "attendance" | "content" | "assignments" | "grades";

const tabs: { id: WorkspaceTab; label: string }[] = [
  { id: "overview", label: "Tổng quan" },
  { id: "sessions", label: "Lịch & Buổi học" },
  { id: "attendance", label: "Điểm danh" },
  { id: "content", label: "Học liệu" },
  { id: "assignments", label: "Bài tập" },
  { id: "grades", label: "Bảng điểm" },
];

const classStatusLabels: Record<ClassStatus, string> = {
  Draft: "Bản nháp",
  Active: "Đang hoạt động",
  Completed: "Đã hoàn thành",
  Archived: "Đã lưu trữ",
};

const sessionStatusLabels: Record<SessionStatus, string> = {
  Scheduled: "Đã lên lịch",
  Completed: "Đã hoàn thành",
  Cancelled: "Đã hủy",
};

const attendanceLabels: Record<AttendanceStatus, string> = {
  Present: "Có mặt",
  Late: "Đi muộn",
  Absent: "Vắng",
  Excused: "Có phép",
};

const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function formatDate(value: string | null) {
  if (!value) return "Chưa thiết lập";
  return new Intl.DateTimeFormat("vi-VN").format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return value.substring(0, 5);
}

function errorMessage(error: unknown) {
  if (!isAxiosError(error)) return "Không thể tải dữ liệu. Vui lòng thử lại.";
  if (!error.response) return "Không kết nối được máy chủ. Vui lòng thử lại sau.";
  if (error.response.status === 401) return "Phiên đăng nhập đã hết. Vui lòng đăng nhập lại.";
  if (error.response.status === 403) return "Bạn không có quyền truy cập lớp học này.";
  if (error.response.status === 404) return "Không tìm thấy lớp học hoặc bạn chưa ghi danh.";
  return "Không thể tải không gian lớp học. Vui lòng thử lại sau.";
}

function SessionModeBadge({ mode }: { mode: SessionMode }) {
  return (
    <span className={styles.modeBadge} data-mode={mode}>
      {mode === "Online" ? <Video size={11} /> : <MapPin size={11} />}
      {mode === "Online" ? "Online" : "Trực tiếp"}
    </span>
  );
}

function AttendanceBadge({ status }: { status: AttendanceStatus | null }) {
  if (!status) return <span className={styles.attendanceBadge} data-status="none">Chưa ghi nhận</span>;
  return (
    <span className={styles.attendanceBadge} data-status={status}>
      {attendanceLabels[status]}
    </span>
  );
}

function ScheduleRow({ schedule }: { schedule: StudentClassSchedule }) {
  return (
    <div className={styles.scheduleRow}>
      <div className={styles.scheduleDays}>
        {schedule.daysOfWeek.map((d) => (
          <span key={d} className={styles.dayChip}>
            {dayNames[d] ?? d}
          </span>
        ))}
      </div>
      <span className={styles.scheduleTime}>
        {formatTime(schedule.startTime)} – {formatTime(schedule.endTime)}
      </span>
      <SessionModeBadge mode={schedule.mode} />
      <span className={styles.scheduleRange}>
        {formatDate(schedule.effectiveFrom)} – {formatDate(schedule.effectiveTo)}
      </span>
    </div>
  );
}

function SessionRow({ session }: { session: StudentSessionWorkspace }) {
  const isCancelled = session.status === "Cancelled";
  return (
    <div className={styles.sessionRow} data-cancelled={isCancelled || undefined}>
      <div className={styles.sessionRowLeft}>
        <SessionModeBadge mode={session.mode} />
        <span className={styles.sessionTime}>{formatDateTime(session.startAt)}</span>
      </div>
      <div className={styles.sessionRowMid}>
        <span className={styles.sessionTitle}>{session.title}</span>
        {session.roomName && session.mode === "Offline" && (
          <span className={styles.sessionRoom}>{session.roomName}</span>
        )}
        <span className={styles.sessionStatus}>{sessionStatusLabels[session.status]}</span>
      </div>
      <div className={styles.sessionRowRight}>
        <AttendanceBadge status={session.myAttendanceStatus} />
        {session.myAttendanceNote && (
          <span className={styles.sessionNote}>{session.myAttendanceNote}</span>
        )}
        {session.mode === "Online" && !isCancelled && (
          <SessionMeetSection
            session={{ id: session.sessionId, mode: session.mode, status: session.status } as SessionView}
            role="student"
          />
        )}
      </div>
    </div>
  );
}

function EmptyTab({ message }: { message: string }) {
  return (
    <div className={styles.emptyTab}>
      <p>{message}</p>
    </div>
  );
}

export function ClassroomWorkspace({ classId }: { classId: string }) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");
  const workspace = useClassroomWorkspace(classId);

  if (workspace.isPending) {
    return (
      <div className={styles.skeleton}>
        <div className={styles.skeletonBar} />
        <div className={styles.skeletonCard} />
      </div>
    );
  }

  if (workspace.isError) {
    return (
      <div className={styles.notice} role="alert">
        <p>{errorMessage(workspace.error)}</p>
        <button onClick={() => void workspace.refetch()}>Thử lại</button>
      </div>
    );
  }

  const data = workspace.data;

  return (
    <div className={styles.root}>
      {/* Tab bar */}
      <div className={styles.tabBar} role="tablist" aria-label="Không gian lớp học">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`workspace-tab-${tab.id}`}
            aria-controls="workspace-tab-panel"
            aria-selected={activeTab === tab.id}
            data-active={activeTab === tab.id || undefined}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panel */}
      <div
        className={styles.tabPanel}
        role="tabpanel"
        id="workspace-tab-panel"
        aria-labelledby={`workspace-tab-${activeTab}`}
      >
        {activeTab === "overview" && (
          <div className={styles.overviewGrid}>
            {/* Class info */}
            <section className={styles.card}>
              <h3 className={styles.cardTitle}>
                <GraduationCap size={15} />
                Thông tin lớp học
              </h3>
              <dl className={styles.facts}>
                <div>
                  <dt>Mã lớp</dt>
                  <dd>
                    <code className={styles.code}>{data.code}</code>
                  </dd>
                </div>
                <div>
                  <dt>Trạng thái</dt>
                  <dd>
                    <span className={styles.statusBadge} data-status={data.status}>
                      {classStatusLabels[data.status]}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Giáo viên</dt>
                  <dd>{data.teacherName ?? "Chưa phân công"}</dd>
                </div>
                <div>
                  <dt>Ngày bắt đầu</dt>
                  <dd>{formatDate(data.startDate)}</dd>
                </div>
                <div>
                  <dt>Ngày kết thúc</dt>
                  <dd>{formatDate(data.endDate)}</dd>
                </div>
                {data.defaultRoomName && (
                  <div>
                    <dt>Phòng học</dt>
                    <dd>{data.defaultRoomName}</dd>
                  </div>
                )}
              </dl>
              {data.description && (
                <p className={styles.description}>{data.description}</p>
              )}
            </section>

            {/* Weekly schedules */}
            <section className={styles.card}>
              <h3 className={styles.cardTitle}>
                <CalendarDays size={15} />
                Lịch học cố định
              </h3>
              {data.schedules.length === 0 ? (
                <p className={styles.emptyNote}>Chưa có lịch học cố định.</p>
              ) : (
                <div className={styles.scheduleList}>
                  {data.schedules.map((s) => (
                    <ScheduleRow key={s.scheduleId} schedule={s} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === "sessions" && (
          <section className={styles.card}>
            <h3 className={styles.cardTitle}>
              <ClipboardList size={15} />
              Danh sách buổi học
            </h3>
            {data.sessions.length === 0 ? (
              <p className={styles.emptyNote}>Chưa có buổi học nào.</p>
            ) : (
              <div className={styles.sessionList}>
                {data.sessions.map((s) => (
                  <SessionRow key={s.sessionId} session={s} />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "attendance" && (
          <StudentAttendanceHistory classId={classId} />
        )}

        {activeTab === "content" && (
          <EmptyTab message="Tài liệu học tập sẽ được giáo viên cập nhật tại đây." />
        )}

        {activeTab === "assignments" && (
          <EmptyTab message="Chưa có bài tập nào được giao." />
        )}

        {activeTab === "grades" && (
          <EmptyTab message="Bảng điểm sẽ được cập nhật sau khi kết thúc khóa học." />
        )}
      </div>
    </div>
  );
}
