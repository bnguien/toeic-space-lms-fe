import type { RouteObject } from "react-router-dom";
import { PracticeSetEditorPage, PracticeSetManagementPage } from "@/modules/practice";
import { ChangePasswordPage, RequireAuth } from "@/modules/auth";
import { TeacherLayout } from "./components/TeacherLayout";
import { TeacherClassesPage } from "./pages/TeacherClassesPage";
import { TeacherSchedulePage } from "./pages/TeacherSchedulePage";
import { TeacherDashboardPage } from "./pages/TeacherDashboardPage";
import { TeacherProfilePage } from "./pages/TeacherProfilePage";

export const teacherRoutes: RouteObject[] = [
  {
    path: "/teacher",
    element: (
      <RequireAuth roles={["Teacher"]}>
        <TeacherLayout />
      </RequireAuth>
    ),
    children: [
      { path: "change-password", element: <ChangePasswordPage embedded /> },
      { index: true, element: <TeacherDashboardPage /> },
      { path: "practice-sets", element: <PracticeSetManagementPage /> },
      { path: "practice-sets/create", element: <PracticeSetEditorPage /> },
      { path: "practice-sets/:id/edit", element: <PracticeSetEditorPage /> },
      { path: "classes", element: <TeacherClassesPage /> },
      { path: "schedule", element: <TeacherSchedulePage /> },
      { path: "settings", element: <TeacherProfilePage /> },
    ],
  },
];
