import { createBrowserRouter, type RouteObject } from "react-router-dom";

import App from "@/App";
import { adminRoutes } from "@/modules/admin";
import { authRoutes } from "@/modules/auth";
import { profileRoutes } from "@/modules/profile";
import { studentRoutes } from "@/modules/student";
import { teacherRoutes } from "@/modules/teacher";
import { RouteError } from "@/shared/components/RouteError/RouteError";
import { TuitionPage } from "@/modules/payment";
import { RequireAuth } from "@/modules/auth";
import { RootLayout } from "./RootLayout";

// Render errors and unknown paths (handled by the "/" route) show a friendly screen.
const withErrorScreen = (routes: RouteObject[]): RouteObject[] =>
  routes.map((route) => ({ ...route, errorElement: <RouteError /> }));

export const router = createBrowserRouter(
  withErrorScreen([
    {
      element: <RootLayout />,
      children: [
        {
          path: "/",
          element: <App />,
        },
        {
          path: "/tuition/:id",
          element: (
            <RequireAuth roles={["Admin"]}>
              <TuitionPage />
            </RequireAuth>
          ),
        },
        ...authRoutes,
        ...adminRoutes,
        ...teacherRoutes,
        ...profileRoutes,
        ...studentRoutes,
      ],
    },
  ]),
);
