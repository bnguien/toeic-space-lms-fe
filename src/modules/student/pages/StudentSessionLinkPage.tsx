import { Navigate, Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { sessionsApi, classErrorMessage } from "@/modules/admin";
import styles from "./StudentClassesPage.module.css";

export function StudentSessionLinkPage() {
  const { sessionId } = useParams();
  const detail = useQuery({
    queryKey: ["student", "class-session", sessionId],
    queryFn: ({ signal }) => sessionsApi.get(sessionId!, signal),
    retry: false,
  });
  if (detail.data)
    return <Navigate replace to={`/my-classes/${detail.data.classId}?session=${detail.data.id}`} />;
  return (
    <main className={styles.page}>
      {detail.isError ? (
        <p role="alert">{classErrorMessage(detail.error)}</p>
      ) : (
        <p role="status">Đang mở buổi học…</p>
      )}
      <Link to="/my-classes">Lớp học của tôi</Link>
    </main>
  );
}
