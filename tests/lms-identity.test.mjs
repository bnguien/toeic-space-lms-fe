import assert from "node:assert/strict";
import test from "node:test";
import axios from "axios";
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { JSDOM } from "jsdom";
import { createServer } from "vite";

test("Identity session, role guards and post-login routing", async () => {
  const dom = new JSDOM("<div id='root'></div>", { url: "http://localhost/" });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const requests = [];
  let role = "User";
  const originalAdapter = axios.defaults.adapter;
  axios.defaults.adapter = async (config) => {
    requests.push(config);
    const user = { id: "test-user", fullName: "Test User", role };
    const data = config.url.endsWith("/me")
      ? user
      : { user, accessToken: config.url.endsWith("/refresh") ? "refreshed" : "login-token" };
    return { data, status: 200, statusText: "OK", headers: {}, config };
  };
  const server = await createServer({
    server: { middlewareMode: true, watch: null },
    appType: "custom",
  });
  try {
    const load = (path) => server.ssrLoadModule("/src/modules/" + path);
    const session = await load("auth/utils/session.ts");
    const { useAuthStore } = await load("auth/store/auth.store.ts");
    const { LoginPage } = await load("auth/pages/LoginPage.tsx");
    const { RequireAuth } = await load("auth/components/RequireAuth.tsx");
    const { default: Home } = await server.ssrLoadModule("/src/App.tsx");
    const { authApi } = await load("auth/api/auth.api.ts");
    for (const [method, suffix] of Object.entries({
      register: "auth/register",
      verifyEmail: "auth/verify-email",
      resendVerification: "auth/resend-verification",
      requestPasswordReset: "v1/auth/password-reset/otp",
      verifyPasswordReset: "v1/auth/password-reset/verify",
      confirmPasswordReset: "v1/auth/password-reset/confirm",
      requestChangePasswordOtp: "v1/auth/change-password/otp",
      changePassword: "v1/auth/change-password",
    })) {
      await authApi[method]({});
      assert.equal(requests.at(-1).url, "/identity/api/" + suffix);
    }
    const { profileApi } = await load("profile/api/profile.api.ts");
    await profileApi.getProfile();
    assert.equal(requests.at(-1).url, "/identity/api/v1/users/me");
    await profileApi.updateProfile({ fullName: "Updated" });
    assert.equal(requests.at(-1).method, "put");
    await profileApi.generateAvatarUploadUrl();
    assert.equal(requests.at(-1).url, "/identity/api/v1/users/me/avatar");
    await session.signIn({ email: "test@example.org", password: "test" });
    assert.equal(useAuthStore.getState().accessToken, "login-token");
    await Promise.all([session.refreshSession(), session.refreshSession()]);
    const refresh = requests.filter((r) => r.url.endsWith("/refresh"));
    assert.equal(refresh.length, 1);
    assert.equal(refresh[0].withCredentials, true);
    assert.equal(refresh[0].headers.get("X-CSRF-Protection"), "1");
    assert.equal(useAuthStore.getState().accessToken, "refreshed");

    const routes = [
      { path: "/", element: h(Home) },
      { path: "/login", element: h(LoginPage) },
      { path: "/admin/login", element: h(LoginPage, { isAdmin: true }) },
      { path: "/my-classes", element: h(RequireAuth, { roles: ["User"] }, "classes") },
      { path: "/admin", element: h(RequireAuth, { roles: ["Admin"] }, "admin") },
      { path: "/teacher", element: h(RequireAuth, { roles: ["Teacher"] }, "teacher") },
      { path: "/profile", element: h(RequireAuth, null, "profile") },
    ];
    const client = new QueryClient();
    async function check(path, expected, content) {
      const router = createMemoryRouter(routes, { initialEntries: [path] });
      const root = createRoot(dom.window.document.querySelector("#root"));
      try {
        await act(async () =>
          root.render(h(QueryClientProvider, { client }, h(RouterProvider, { router }))),
        );
        const { pathname, search } = router.state.location;
        assert.equal(pathname + search, expected, path);
        if (content) assert.ok(dom.window.document.body.textContent.includes(content), path);
      } finally {
        await act(async () => root.unmount());
        router.dispose();
      }
    }
    await check("/login", "/my-classes", "classes");
    await check("/", "/my-classes", "classes");
    for (const tab of ["calendar", "classes", "attendance"]) {
      const next = "/my-classes?tab=" + tab;
      await check("/login?next=" + encodeURIComponent(next), next, "classes");
    }
    for (const next of ["/courses", "//example.org", "/admin", "/%6cogin"]) {
      await check("/login?next=" + encodeURIComponent(next), "/my-classes", "classes");
    }
    await check("/login?next=%2Fprofile", "/profile", "profile");
    for (const path of ["/admin", "/teacher", "/admin/login"]) {
      await check(path, "/my-classes", "classes");
    }
    for (role of ["Admin", "Teacher"]) {
      await session.signIn({});
      await check("/admin/login", "/" + role.toLowerCase(), role.toLowerCase());
      const home = "/" + role.toLowerCase();
      for (const path of [
        "/login",
        "/my-classes",
        "/login?next=%2Fmy-classes",
        role === "Admin" ? "/teacher" : "/admin",
      ]) {
        await check(path, home, role.toLowerCase());
      }
    }
    await session.signOut();
    assert.equal(useAuthStore.getState().status, "anonymous");
    await check("/profile", "/login?next=%2Fprofile");
    role = "User";
    await session.restoreSession(true);
    assert.equal(useAuthStore.getState().user.role, "User");
  } finally {
    axios.defaults.adapter = originalAdapter;
    await server.close();
    dom.window.close();
  }
});
