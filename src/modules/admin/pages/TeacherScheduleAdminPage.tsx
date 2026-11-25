import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import mascot from "@/assets/mascot/oy2-teamwork.png";
import { ClassScheduleCalendar } from "@/modules/teacher";
import { Search } from "lucide-react";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import type { TeacherOption } from "../types/class.types";
import styles from "./ClassesPage.module.css";
import { loadAllPages } from "@/shared/utils/loadAllPages";
import { classesApi } from "../api/classes.api";
import { classKeys } from "../api/classes.query-keys";
import { AdminPage, Button, Card, ListHero } from "../components/ui";

export function TeacherScheduleAdminPage() {
  const [teacher, setTeacher] = useState<TeacherOption | null>(null);
  const teacherId = teacher?.id;
  const [search, setSearch] = useState("");
  const term = useDebouncedValue(search.trim(), 250);
  const searching = !teacher && Boolean(search.trim());
  const navigate = useNavigate();
  const teachers = useQuery({
    enabled: searching && Boolean(term) && term === search.trim(),
    queryKey: [...classKeys.teachers(term), "all-pages"],
    queryFn: ({ signal }) => loadAllPages((page) => classesApi.teachers(term, signal, page)),
  });
  const classes = useQuery({
    queryKey: [...classKeys.lists(), "calendar-names"],
    enabled: Boolean(teacherId),
    queryFn: async ({ signal }) => {
      const rows = await loadAllPages((page) => classesApi.list({ page, pageSize: 100 }, signal));
      return new Map(rows.map((row) => [row.id, row.name]));
    },
  });
  return (
    <AdminPage
      theme="blue"
      hero={
        <ListHero
          eyebrow="Quản trị đào tạo / Giáo viên"
          title="Lịch dạy"
          highlight="giáo viên"
          description="Xem các buổi dạy của giáo viên theo tuần."
          mascot={mascot}
        />
      }
    >
      <Card title="Giáo viên">
        <div style={{ maxWidth: 520 }}>
          <div className={styles.teacherSearch}>
            <Search size={15} aria-hidden="true" />
            <input
              type="search"
              aria-label="Tìm giáo viên theo tên hoặc email"
              placeholder="Tìm theo tên hoặc email giáo viên…"
              value={search}
              onFocus={(event) => {
                if (teacher) event.currentTarget.select();
              }}
              onChange={(event) => {
                setTeacher(null);
                setSearch(event.target.value);
              }}
            />
          </div>
          {searching && (
            <div className={styles.teacherList} style={{ maxHeight: 300, overflowY: "auto" }}>
              {term !== search.trim() || teachers.isPending ? (
                <p role="status" className={styles.inlineState}>
                  Đang tìm giáo viên…
                </p>
              ) : teachers.isError ? (
                <p role="alert">
                  Không thể tìm giáo viên.{" "}
                  <Button onClick={() => void teachers.refetch()}>Thử lại</Button>
                </p>
              ) : !teachers.data.length ? (
                <p role="status" className={styles.inlineState}>
                  Không tìm thấy giáo viên phù hợp.
                </p>
              ) : (
                teachers.data.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => {
                      setTeacher(item);
                      setSearch(item.fullName);
                    }}
                  >
                    <span aria-hidden="true">{item.fullName.slice(0, 1)}</span>
                    <div>
                      <strong>{item.fullName}</strong>
                      <small>{item.email}</small>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </Card>
      {teacherId && (
        <ClassScheduleCalendar
          key={teacherId}
          role="admin"
          teacherId={teacherId}
          selectedTeacherName={teacher.fullName}
          classNames={classes.data ?? new Map()}
          onManageClass={(session) => navigate(`/admin/classes/list/${session.classId}`)}
        />
      )}
    </AdminPage>
  );
}
