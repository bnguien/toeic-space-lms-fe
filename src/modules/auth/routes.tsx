import { Navigate, type RouteObject } from "react-router-dom";

import { AuthLayout } from "./components/AuthLayout";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { RequireAuth } from "./components/RequireAuth";

import { useCurrentUser } from "./hooks/useAuth";
import { PORTAL_HOME } from "./utils/auth-helpers";

function PasswordRoute() {
  const user = useCurrentUser();
  if (user && user.role !== "User") {
    return <Navigate to={`${PORTAL_HOME[user.role]}/change-password`} replace />;
  }
  return <ChangePasswordPage />;
}

export const authRoutes: RouteObject[] = [
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  {
    path: "/change-password",
    element: (
      <RequireAuth>
        <PasswordRoute />
      </RequireAuth>
    ),
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/register",
        element: <RegisterPage />,
      },
      {
        path: "/verify-email",
        element: <VerifyEmailPage />,
      },
    ],
  },
  {
    path: "/admin/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/verify-email",
    element: <VerifyEmailPage />,
  },
];
