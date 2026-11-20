import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { matchRoutes } from "react-router-dom";
import { JSDOM } from "jsdom";
import { createServer } from "vite";

test("LMS routes, login destinations and class-scoped attendance", async () => {
  const dom = new JSDOM("", { url: "http://127.0.0.1:15173/" });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  const server = await createServer({ server: { middlewareMode: true, hmr: false, watch: null } });
  try {
    const { router } = await server.ssrLoadModule("/src/app/router.tsx");
    for (const path of [
      "/my-classes",
      "/my-classes/abc",
      "/teacher/schedule",
      "/admin/classes/list",
      "/login",
      "/admin/login",
      "/register",
      "/verify-email",
      "/forgot-password",
      "/reset-password",
      "/change-password",
      "/profile",
      "/teacher/settings",
      "/teacher/practice-sets",
      "/admin/tuition",
      "/tuition/abc",
    ]) {
      assert.ok(matchRoutes(router.routes, path), path);
    }
    for (const path of [
      "/courses",
      "/my-courses",
      "/admin/courses/list",
      "/teacher/courses",
      "/orders/abc",
      "/games/news",
      "/vocabulary",
      "/practice/exam",
    ]) {
      assert.equal(matchRoutes(router.routes, path), null, path);
    }
    const { getSafeRedirect } = await server.ssrLoadModule(
      "/src/modules/auth/utils/auth-helpers.ts",
    );
    for (const next of ["//example.org", "/a/..//example.org", "/login", "https://example.org"]) {
      assert.equal(getSafeRedirect(next, "/my-classes"), "/my-classes");
    }
    assert.equal(getSafeRedirect("/my-classes/a?tab=calendar"), "/my-classes/a?tab=calendar");

    const { StudentAttendanceHistory } = await server.ssrLoadModule(
      "/src/modules/student/components/StudentAttendanceHistory.tsx",
    );
    const client = new QueryClient();
    const records = Array.from({ length: 33 }, (_, index) => {
      const classId = index < 21 ? "other" : "mine";
      const id = String(index);
      client.setQueryData(["student", "class-session", id], {
        id,
        classId,
        title: classId + id,
        startAt: "2026-11-19T08:00:00Z",
      });
      return { id, classSessionId: id, status: "Present" };
    });
    client.setQueryData(["student", "my-attendance"], records);
    const html = renderToStaticMarkup(
      createElement(
        QueryClientProvider,
        { client },
        createElement(StudentAttendanceHistory, { classId: "mine" }),
      ),
    );
    assert.match(html, /Trang 1 \/ 2/);
    assert.equal((html.match(/<tbody>.*?<\/tbody>/s)[0].match(/<tr>/g) ?? []).length, 10);
    assert.match(html, /mine21/);
    assert.doesNotMatch(html, /other0|mine31/);
    router.dispose();
  } finally {
    await server.close();
    dom.window.close();
  }
});
