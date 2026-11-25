import assert from "node:assert/strict";
import test from "node:test";
import { act, createElement as h, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { JSDOM } from "jsdom";
import { createServer } from "vite";
import { HubConnectionBuilder } from "@microsoft/signalr";

test("authenticated bell uses REST while negotiate fails and reconciles on reconnect", async (t) => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/" });
  globalThis.window = dom.window;
  const { document } = dom.window;
  globalThis.document = document;
  globalThis.localStorage = dom.window.localStorage;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const server = await createServer({
    server: { middlewareMode: true, hmr: false, watch: null, ws: false },
  });
  const root = createRoot(document.getElementById("root"));
  const hubs = [];
  t.mock.method(HubConnectionBuilder.prototype, "build", function () {
    const listeners = new Map();
    const hub = {
      listeners,
      started: 0,
      stopped: 0,
      options: this.httpConnectionOptions,
      on: (name, fn) => listeners.set(name, fn),
      off: (name) => listeners.delete(name),
      onreconnected(fn) {
        this.reconnect = fn;
      },
      onclose() {},
      async start() {
        this.started++;
        assert.equal(listeners.size, 2);
        throw Error("offline");
      },
      async stop() {
        this.stopped++;
      },
    };
    hubs.push(hub);
    return hub;
  });
  try {
    const { useAuthStore } = await server.ssrLoadModule("/src/modules/auth/store/auth.store.ts");
    const { NotificationProvider, NotificationBell } = await server.ssrLoadModule(
      "/src/modules/notifications/index.ts",
    );
    const { httpClient } = await server.ssrLoadModule("/src/services/http/httpClient.ts");
    const setUser = (id, token) =>
      useAuthStore
        .getState()
        .setSession({ user: { id, role: "User", fullName: id }, accessToken: token });
    let rows = [
      {
        id: "one",
        title: "Thông báo A",
        body: "Nội dung",
        createdAt: "2026-11-23T10:00:00Z",
        isRead: false,
        type: "ActiveAccountCreated",
        navigationPath: null,
      },
    ];
    const calls = [];
    httpClient.defaults.adapter = async (config) => {
      calls.push([config.method, config.url]);
      const base = "/notification/api/v1/notifications";
      let data,
        status = 200;
      if (config.method === "patch") {
        assert.ok([base + "/one/read", base + "/read-all"].includes(config.url));
        rows = rows.map((row) => ({ ...row, isRead: true }));
        data = "";
        status = 204;
      } else if (config.url === base + "/unread-count")
        data = { count: rows.filter((r) => !r.isRead).length };
      else {
        assert.equal(config.url, base);
        data = {
          items: config.params.isRead === false ? rows.filter((i) => !i.isRead) : rows,
          pageIndex: 1,
          hasNextPage: false,
        };
      }
      return { config, data, status, statusText: "", headers: {} };
    };
    setUser("A", "first-token");
    await act(async () => {
      root.render(
        h(
          StrictMode,
          null,
          h(MemoryRouter, null, h(NotificationProvider, null, h(NotificationBell))),
        ),
      );
    });
    const hub = hubs.find((h) => h.started);
    assert.equal(hubs.filter((h) => h.started).length, 1);
    const click = async (fn) => {
      const button = [...document.querySelectorAll("button")].find(fn);
      assert.ok(button);
      await act(async () => button.click());
    };
    const bell = () => document.querySelector("button[aria-expanded]");
    assert.match(bell().getAttribute("aria-label"), /1 chưa đọc/);
    await click((b) => b === bell());
    await click((b) => b.textContent.includes("Thông báo A"));
    assert.ok(calls.some(([m, url]) => m === "patch" && url.endsWith("/one/read")));
    await click((b) => b === bell());
    assert.match(bell().getAttribute("aria-label"), /0 chưa đọc/);
    rows.push({ ...rows[0], id: "two", title: "Điểm thi mới", isRead: false });
    await act(async () => hub.reconnect());
    assert.ok(document.body.textContent.includes("Điểm thi mới"));
    await click((b) => b.getAttribute("aria-label") === "Tùy chọn thông báo");
    await click((b) => b.textContent.trim() === "Đánh dấu tất cả là đã đọc");
    assert.ok(calls.some(([m, url]) => m === "patch" && url.endsWith("/read-all")));
    await act(async () => setUser("A", "renewed-token"));
    assert.equal(hub.options.accessTokenFactory(), "renewed-token");
    await act(async () => {
      useAuthStore.getState().clearSession();
      rows = [];
      setUser("B", "second-token");
    });
    assert.equal(hub.options.accessTokenFactory(), "");
    assert.equal(hub.listeners.size, 0);
    assert.ok(hub.stopped);
    await click((b) => b === bell());
    assert.ok(!document.body.textContent.includes("Thông báo A"));
    assert.match(document.body.textContent, /Không có thông báo/);
  } finally {
    await act(async () => root.unmount());
    await server.close();
    dom.window.close();
  }
});
