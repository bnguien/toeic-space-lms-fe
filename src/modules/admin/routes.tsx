import { Navigate, Outlet, type RouteObject } from "react-router-dom";

import { TuitionOverview, TuitionStatements, TuitionCreate } from "@/modules/payment";
import { ChangePasswordPage, RequireAuth } from "@/modules/auth";

import { AdminShell } from "./components/AdminShell";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AdminExamBankPage } from "./pages/AdminExamBankPage";
import { AdminExamsListPage } from "./pages/AdminExamsListPage";
import { AdminPartQuestionsPage } from "./pages/AdminPartQuestionsPage";
import { ClassesPage } from "./pages/ClassesPage";
import { ClassesOverviewPage } from "./pages/ClassesOverviewPage";
import { ClassesLifecyclePage } from "./pages/ClassesLifecyclePage";
import { FacilitiesPage } from "./pages/FacilitiesPage";
import { UserDetailRedirect } from "./pages/UserDetailRedirect";
import { UserListPage } from "./pages/UserListPage";
import { UserOverviewPage } from "./pages/UserOverviewPage";

export const adminRoutes: RouteObject[] = [
  {
    path: "/admin",
    // CMS is exclusively for administrators. Teachers use the separate /teacher LMS.
    element: (
      <RequireAuth roles={["Admin"]}>
        <AdminShell />
      </RequireAuth>
    ),
    children: [
      { path: "change-password", element: <ChangePasswordPage embedded /> },
      { path: "tuition", element: <TuitionOverview /> },
      { path: "tuition/create", element: <TuitionCreate /> },
      { path: "tuition/statements/:id?", element: <TuitionStatements /> },
      {
        index: true,
        element: <AdminDashboardPage />,
      },

      /* Tài khoản: chỉ quản trị viên, API kiểm tra cùng quy tắc. */
      {
        element: (
          <RequireAuth roles={["Admin"]}>
            <Outlet />
          </RequireAuth>
        ),
        children: [
          { path: "students", element: <UserOverviewPage key="User" role="User" /> },
          { path: "students/list", element: <UserListPage key="User" role="User" /> },
          {
            path: "students/activities",
            element: <UserListPage key="User-activity" role="User" mode="activity" />,
          },
          { path: "teachers", element: <UserOverviewPage key="Teacher" role="Teacher" /> },
          { path: "teachers/list", element: <UserListPage key="Teacher" role="Teacher" /> },
          {
            path: "teachers/schedule",
            lazy: async () => ({
              Component: (await import("./pages/TeacherScheduleAdminPage"))
                .TeacherScheduleAdminPage,
            }),
          },
          {
            path: "teachers/activities",
            element: <UserListPage key="Teacher-activity" role="Teacher" mode="activity" />,
          },
          { path: "teachers/stats", element: <Navigate to="/admin/teachers" replace /> },
          { path: "system/admins", element: <UserListPage key="Admin" role="Admin" /> },
          { path: "system/users", element: <UserListPage key="All" /> },
          // Details open in a drawer now; keep old links working.
          { path: "users/:userId", element: <UserDetailRedirect /> },
        ],
      },

      /* Lớp học */
      { path: "classes", element: <ClassesOverviewPage /> },
      {
        path: "classes/teacher-schedule",
        element: <Navigate to="/admin/teachers/schedule" replace />,
      },
      { path: "classes/list", element: <ClassesPage /> },
      { path: "classes/list/:id", element: <ClassesPage /> },
      { path: "classes/facilities", element: <FacilitiesPage /> },
      { path: "facilities", element: <Navigate to="/admin/classes/facilities" replace /> },
      { path: "classes/lifecycle", element: <ClassesLifecyclePage /> },
      { path: "classes/lifecycle/:id", element: <ClassesLifecyclePage /> },
      { path: "classes/archived", element: <Navigate to="/admin/classes/lifecycle" replace /> },
      {
        path: "classes/deleted",
        element: <Navigate to="/admin/classes/lifecycle?tab=deleted" replace />,
      },

      /* Ngân hàng đề */
      { path: "exams", element: <AdminExamBankPage /> },
      { path: "exams/list", element: <AdminExamsListPage /> },
      ...Array.from({ length: 7 }, (_, index) => ({
        path: `exams/list/:testId/part-${index + 1}`,
        element: <AdminPartQuestionsPage key={`exam-${index + 1}`} part={index + 1} />,
      })),
      ...Array.from({ length: 7 }, (_, index) => ({
        path: `exams/part-${index + 1}`,
        element: <AdminPartQuestionsPage key={index + 1} part={index + 1} />,
      })),
      ...["question-sets", "tags", "import", "reports"].map((path) => ({
        path: `exams/${path}`,
        element: <Navigate to="/admin/exams/list" replace />,
      })),
    ],
  },
];
