import { isAxiosError } from "axios";
import { CalendarDays, GraduationCap, MapPin, Video } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useStudentPortalOverview } from "../hooks/useStudentWorkspace";
import type { ClassStatus, StudentEnrolledClassSummary } from "../types/student-workspace.types";
import styles from "./StudentPortalOverview.module.css";

const classStatusLabels: Record<ClassStatus, string> = {
  Draft: "Bản nháp",
  Active: "Đang hoạt động",
  Completed: "Đã hoàn thành",
  Archived: "Đã lưu trữ",
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDate(value: string | null) {
  if (!value) return "Chưa thiết lập";
  return new Intl.DateTimeFormat("vi-VN").format(new Date(`${value}T00:00:00`));
}

function errorMessage(error: unknown) {
  if (!isAxiosError(error)) return "Không thể tải dữ liệu. Vui lòng thử lại.";
  if (!error.response) return "Không kết nối được máy chủ. Vui lòng thử lại sau.";
  if (error.response.status === 401) return "Phiên đăng nhập đã hết. Vui lòng đăng nhập lại.";
  return "Không thể tải tổng quan. Vui lòng thử lại sau.";
}

function AttendanceBar({
  present,
  late,
  absent,
  total,
}: {
  present: number;
  late: number;
  absent: number;
  total: number;
}) {
  if (total === 0) return <p className={styles.emptyNote}>Chưa có buổi học nào được ghi nhận.</p>;
  const presentPct = Math.round((present / total) * 100);
  const latePct = Math.round((late / total) * 100);
  const absentPct = Math.round((absent / total) * 100);
  return (
    <div className={styles.bar}>
      {present > 0 && (
        <div
          className={styles.barPresent}
          style={{ width: `${presentPct}%` }}
          title={`Có mặt: ${present}`}
        />
      )}
      {late > 0 && (
        <div
          className={styles.barLate}
          style={{ width: `${latePct}%` }}
          title={`Đi muộn: ${late}`}
        />
      )}
      {absent > 0 && (
        <div
          className={styles.barAbsent}
          style={{ width: `${absentPct}%` }}
          title={`Vắng: ${absent}`}
        />
      )}
    </div>
  );
}

function EnrolledClassCard({ item }: { item: StudentEnrolledClassSummary }) {
  const location = useLocation();
  return (
    <Link
      to={`/my-classes/${item.classId}${location.search}`}
      className={styles.classCard}
      aria-label={`Vào lớp ${item.name}`}
    >
      <div className={styles.classCardTop}>
        <span className={styles.classCode}>{item.code}</span>
        <span className={styles.classBadge} data-status={item.status}>
          {classStatusLabels[item.status]}
        </span>
      </div>
      <strong className={styles.className}>{item.name}</strong>
      <dl className={styles.classMeta}>
        <div>
          <dt>Giáo viên</dt>
          <dd>{item.teacherName ?? "Chưa phân công"}</dd>
        </div>
        <div>
          <dt>Thời gian</dt>
          <dd>
            {formatDate(item.startDate)} – {formatDate(item.endDate)}
          </dd>
        </div>
        {item.defaultRoomName && (
          <div>
            <dt>Phòng</dt>
            <dd>{item.defaultRoomName}</dd>
          </div>
        )}
      </dl>
    </Link>
  );
}

export function StudentPortalOverview() {
  const overview = useStudentPortalOverview();

  if (overview.isPending) {
    return (
      <div className={styles.skeleton}>
        <div className={styles.skeletonCard} />
        <div className={styles.skeletonCard} />
        <div className={styles.skeletonCard} />
      </div>
    );
  }

  if (overview.isError) {
    return (
      <div className={styles.notice} role="alert">
        <p>{errorMessage(overview.error)}</p>
        <button onClick={() => void overview.refetch()}>Thử lại</button>
      </div>
    );
  }

  const { enrolledClasses, upcomingSessions, attendanceSummary } = overview.data;
  const attendancePct =
    attendanceSummary.totalRecorded > 0
      ? Math.round((attendanceSummary.presentCount / attendanceSummary.totalRecorded) * 100)
      : null;

  return (
    <div className={styles.root}>
      {/* Attendance summary */}
      <section className={styles.card} aria-label="Thống kê chuyên cần">
        <h2 className={styles.cardTitle}>
          <GraduationCap size={16} />
          Chuyên cần
        </h2>
        {attendanceSummary.totalRecorded === 0 ? (
          <p className={styles.emptyNote}>Chưa có buổi học nào được ghi nhận.</p>
        ) : (
          <>
            <div className={styles.attendanceStats}>
              <div className={styles.attendancePct}>
                <span className={styles.pctValue}>{attendancePct ?? 0}%</span>
                <span className={styles.pctLabel}>Tỉ lệ có mặt</span>
              </div>
              <dl className={styles.attendanceCounts}>
                <div data-type="present">
                  <dt>Có mặt</dt>
                  <dd>{attendanceSummary.presentCount}</dd>
                </div>
                <div data-type="late">
                  <dt>Đi muộn</dt>
                  <dd>{attendanceSummary.lateCount}</dd>
                </div>
                <div data-type="absent">
                  <dt>Vắng</dt>
                  <dd>{attendanceSummary.absentCount}</dd>
                </div>
                <div data-type="excused">
                  <dt>Có phép</dt>
                  <dd>{attendanceSummary.excusedCount}</dd>
                </div>
                <div data-type="total">
                  <dt>Tổng buổi</dt>
                  <dd>{attendanceSummary.totalRecorded}</dd>
                </div>
              </dl>
            </div>
            <AttendanceBar
              present={attendanceSummary.presentCount}
              late={attendanceSummary.lateCount}
              absent={attendanceSummary.absentCount}
              total={attendanceSummary.totalRecorded}
            />
          </>
        )}
      </section>

      {/* Upcoming sessions */}
      <section className={styles.card} aria-label="Buổi học sắp tới">
        <h2 className={styles.cardTitle}>
          <CalendarDays size={16} />
          Buổi học sắp tới
        </h2>
        {upcomingSessions.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Không có buổi học nào trong 14 ngày tới.</p>
          </div>
        ) : (
          <ul className={styles.sessionList} role="list">
            {upcomingSessions.map((session) => (
              <li key={session.sessionId} className={styles.sessionItem}>
                <div className={styles.sessionLeft}>
                  <span className={styles.sessionMode} data-mode={session.mode}>
                    {session.mode === "Online" ? <Video size={13} /> : <MapPin size={13} />}
                    {session.mode === "Online" ? "Online" : "Trực tiếp"}
                  </span>
                  <span className={styles.sessionTime}>{formatDateTime(session.startAt)}</span>
                </div>
                <div className={styles.sessionRight}>
                  <span className={styles.sessionClass}>{session.className}</span>
                  <span className={styles.sessionTitle}>{session.title}</span>
                  {session.mode === "Offline" && session.roomName && (
                    <span className={styles.sessionRoom}>{session.roomName}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Enrolled classes */}
      <section className={styles.card} aria-label="Lớp học đang tham gia">
        <h2 className={styles.cardTitle}>
          <GraduationCap size={16} />
          Lớp học của tôi
        </h2>
        {enrolledClasses.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Bạn chưa tham gia lớp học nào.</p>
          </div>
        ) : (
          <div className={styles.classGrid}>
            {enrolledClasses.map((item) => (
              <EnrolledClassCard key={item.classId} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
