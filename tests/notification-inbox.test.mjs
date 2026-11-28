import test from "node:test";
import assert from "node:assert/strict";
import { Inbox } from "../src/modules/notifications/inbox.ts";
import { destination } from "../src/modules/notifications/destination.ts";

const tick = () => new Promise((resolve) => setImmediate(resolve));
const row = (id, isRead = false) => ({ id, createdAt: "2026-11-" + id + "T10:00:00Z", isRead });
function fixture(overrides = {}) {
  const api = {
    count: async () => 38,
    list: async (page) => ({
      pageIndex: page,
      items: page === 1 ? [row("22"), row("21")] : [row("21"), row("20")],
      hasNextPage: page === 1,
    }),
    read: async () => {},
    ...overrides,
  };
  const inbox = new Inbox(api);
  inbox.open(true);
  return inbox;
}
test("total unread is independent of loaded pages; concurrent load-more and duplicate ids merge", async () => {
  const calls = [];
  const inbox = fixture({
    list: async (page, unread) => {
      calls.push([page, unread]);
      return {
        pageIndex: page,
        hasNextPage: page === 1,
        items: page === 1 ? [row("21"), row("22")] : [row("20"), row("21")],
      };
    },
  });
  await tick();
  assert.equal(inbox.snapshot().count, 38);
  await Promise.all([inbox.load(true), inbox.load(true)]);
  await inbox.load(true);
  assert.deepEqual(
    inbox.snapshot().items.map((i) => i.id),
    ["22", "21", "20"],
  );
  inbox.filter(true);
  await tick();
  assert.deepEqual(calls, [
    [1, false],
    [2, false],
    [1, true],
  ]);
});
test("duplicate read clicks share one PATCH and server count wins over concurrent completion", async () => {
  let finish,
    calls = 0,
    read = false;
  const inbox = fixture({
    read: () => {
      calls++;
      return new Promise((resolve) => {
        finish = () => {
          read = true;
          resolve();
        };
      });
    },
    count: async () => (read ? 37 : 38),
    list: async () => ({ pageIndex: 1, items: read ? [] : [row("22")], hasNextPage: false }),
  });
  inbox.filter(true);
  await tick();
  const pending = inbox.mark("22");
  assert.equal(await inbox.mark("22"), false);
  inbox.countChanged({ count: 37 });
  finish();
  assert.equal(await pending, true);
  await tick();
  assert.equal(calls, 1);
  assert.equal(inbox.snapshot().count, 37);
  assert.deepEqual(inbox.snapshot().items, []);
});
test("failed read-all retains state and a successful empty response clears unread", async () => {
  let failed = true,
    done = false;
  const inbox = fixture({
    read: async (id) => {
      assert.equal(id, undefined);
      if (failed) throw Error();
      done = true;
    },
    list: async () => ({ items: done ? [] : [row("21")], pageIndex: 1, hasNextPage: false }),
    count: async () => (done ? 0 : 1),
  });
  inbox.filter(true);
  await tick();
  assert.equal(await inbox.mark(), false);
  assert.equal(inbox.snapshot().items.length, 1);
  assert.equal(inbox.snapshot().count, 1);
  failed = false;
  assert.equal(await inbox.mark(), true);
  await tick();
  assert.equal(inbox.snapshot().count, 0);
  assert.deepEqual(inbox.snapshot().items, []);
});
test("older REST response cannot overwrite creation and duplicate delivery", async () => {
  let resolveFirst,
    first = true;
  const inbox = fixture({
    list: () => {
      if (first) {
        first = false;
        return new Promise((resolve) => {
          resolveFirst = resolve;
        });
      }
      return Promise.resolve({ items: [row("22")], pageIndex: 1, hasNextPage: false });
    },
  });
  inbox.created(row("22"));
  inbox.created(row("22"));
  await tick();
  resolveFirst({ items: [], pageIndex: 1, hasNextPage: false });
  await tick();
  assert.deepEqual(
    inbox.snapshot().items.map((i) => i.id),
    ["22"],
  );
});
test("other tab refetches open unread list on count event; REST recovers missed events on reconnect", async () => {
  let rows = [row("21")];
  const api = {
    list: async () => ({ items: rows, pageIndex: 1, hasNextPage: false }),
    count: async () => rows.length,
    read: async () => {
      rows = [];
    },
  };
  const a = fixture(api),
    b = fixture(api);
  b.filter(true);
  await tick();
  await a.mark("21");
  b.countChanged({ count: 0 });
  await tick();
  assert.deepEqual(b.snapshot().items, []);
  assert.equal(b.snapshot().count, 0);
  rows = [row("22")];
  b.refresh();
  await tick();
  assert.equal(b.snapshot().count, 1);
  assert.equal(b.snapshot().items[0].id, "22");
});
test("logout discards old responses while a new account loads", async () => {
  let finish;
  const a = fixture({
    list: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  });
  a.dispose();
  const b = fixture();
  finish({ items: [row("25")], pageIndex: 1, hasNextPage: false });
  await tick();
  assert.deepEqual(a.snapshot().items, []);
  assert.equal(
    b.snapshot().items.some((i) => i.id === "25"),
    false,
  );
});
test("refresh failure leaves previous notices visible", async () => {
  let fail = false;
  const inbox = fixture({
    list: async () => {
      if (fail) throw Error();
      return { items: [row("22")], pageIndex: 1, hasNextPage: false };
    },
  });
  await tick();
  fail = true;
  inbox.refresh();
  await tick();
  assert.equal(inbox.snapshot().listError, true);
  assert.equal(inbox.snapshot().items[0].id, "22");
});
test("scored attempts without a registered result route and unsafe targets open inline", () => {
  for (const path of [
    null,
    "//example.org",
    "https://example.org",
    "/\\evil.org",
    "/assessment/api/v1/attempts/abc/result",
    "/exam/results/abc",
    "/admin/exams",
  ])
    assert.equal(destination("ExamAttemptScored", path, "User"), null);
  assert.equal(destination("ExamAttemptScored", "/my-classes", "User"), "/my-classes");
  assert.equal(destination("ActiveAccountCreated", null, "User"), "/profile");
  assert.equal(destination("StudentEnrolled", null, "User", "abc"), "/my-classes/abc");
  assert.equal(destination("StudentWithdrawn", null, "User", "abc"), "/my-classes");
  assert.equal(destination("SessionAdded", null, "User", "abc"), "/my-classes/sessions/abc");
  for (const type of ["Unknown"]) assert.equal(destination(type, "/my-classes", "User"), null);
});
