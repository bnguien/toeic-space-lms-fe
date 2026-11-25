import { useContext, useEffect, useRef, useSyncExternalStore, useState } from "react";
import { Bell, Check, Ellipsis, CheckCheck, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "@/modules/auth";
import { InboxContext } from "./context";
import type { Inbox, Notice } from "./inbox";
import { destination } from "./destination";
import styles from "./bell.module.css";

export function NotificationBell() {
  const inbox = useContext(InboxContext);
  const user = useCurrentUser();
  return inbox && user ? <BellMenu key={user.id} inbox={inbox} role={user.role} /> : null;
}
function BellMenu({ inbox, role }: { inbox: Inbox; role: string }) {
  const state = useSyncExternalStore(inbox.subscribe, inbox.snapshot);
  const navigate = useNavigate();
  const anchor = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const options = useRef<HTMLDivElement>(null);
  const optionsTrigger = useRef<HTMLButtonElement>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [detail, setDetail] = useState<Notice | null>(null);
  useEffect(() => () => inbox.open(false), [inbox]);
  useEffect(() => {
    if (!state.open) return;
    const outside = (e: PointerEvent) => {
      if (!options.current?.contains(e.target as Node)) setOptionsOpen(false);
      if (!anchor.current?.contains(e.target as Node)) inbox.open(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (optionsOpen) {
          setOptionsOpen(false);
          optionsTrigger.current?.focus();
          return;
        }
        inbox.open(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [inbox, state.open, optionsOpen]);
  function select(item: Notice) {
    if (!item.isRead) void inbox.mark(item.id);
    const path = destination(item.type, item.navigationPath, role, item.relatedEntityId);
    if (path) {
      inbox.open(false);
      void navigate(path);
    } else setDetail(item);
  }
  return (
    <div ref={anchor} className={styles.anchor}>
      <button
        ref={trigger}
        type="button"
        className={styles.trigger}
        aria-label={`Thông báo, ${state.count} chưa đọc`}
        aria-expanded={state.open}
        onClick={() => {
          setOptionsOpen(false);
          setDetail(null);
          inbox.open(!state.open);
        }}
      >
        <Bell size={20} />
        {state.count > 0 && <span>{state.count}</span>}
      </button>
      {state.open && (
        <section className={styles.panel} aria-label="Thông báo cá nhân">
          <div className={styles.heading}>
            <h2>Thông báo</h2>
            {!detail && (
              <div
                className={styles.options}
                ref={options}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) setOptionsOpen(false);
                }}
              >
                <button
                  type="button"
                  ref={optionsTrigger}
                  className={styles.icon}
                  aria-label="Tùy chọn thông báo"
                  aria-expanded={optionsOpen}
                  onClick={() => setOptionsOpen(!optionsOpen)}
                >
                  <Ellipsis size={21} />
                </button>
                {optionsOpen && (
                  <div className={styles.popover}>
                    <button
                      disabled={state.saving || !state.count}
                      onClick={() => {
                        setOptionsOpen(false);
                        optionsTrigger.current?.focus();
                        void inbox.mark();
                      }}
                    >
                      <CheckCheck size={18} /> Đánh dấu tất cả là đã đọc
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          {detail ? (
            <>
              <div className={styles.content}>
                <h3>{detail.title}</h3>
                <p>{detail.body}</p>
                <button onClick={() => setDetail(null)}>Quay lại danh sách</button>
              </div>
            </>
          ) : (
            <>
              <div className={styles.actions}>
                {[false, true].map((unread) => (
                  <button
                    key={String(unread)}
                    aria-pressed={state.unread === unread}
                    onClick={() => inbox.filter(unread)}
                  >
                    {unread ? "Chưa đọc" : "Tất cả"}
                  </button>
                ))}
              </div>
              <div className={styles.content}>
                {(state.listError || state.countError) && (
                  <p role="alert">
                    Không tải được thông báo.{" "}
                    <button onClick={inbox.refresh}>
                      <RefreshCw size={14} /> Thử lại
                    </button>
                  </p>
                )}
                {state.saveError && (
                  <p role="alert">Chưa đánh dấu được. Vui lòng thử lại thao tác.</p>
                )}
                {state.items.map((item) => (
                  <div key={item.id} className={styles.row}>
                    <button
                      className={styles.item}
                      disabled={state.saving}
                      onClick={() => void select(item)}
                    >
                      <strong>{item.title}</strong>
                      <span>{item.body}</span>
                      <small>
                        {!item.isRead && "● Chưa đọc · "}
                        {new Date(item.createdAt).toLocaleString("vi-VN")}
                      </small>
                    </button>
                    {!item.isRead && (
                      <button
                        className={styles.mark}
                        disabled={state.saving}
                        aria-label={`Đánh dấu đã đọc: ${item.title}`}
                        title="Đánh dấu đã đọc"
                        onClick={() => void inbox.mark(item.id)}
                      >
                        <Check size={16} />
                      </button>
                    )}
                  </div>
                ))}
                {state.loading ? (
                  <p role="status">Đang tải…</p>
                ) : (
                  !state.items.length &&
                  !state.listError && <p>Không có thông báo{state.unread ? " chưa đọc" : ""}.</p>
                )}
                {state.more && (
                  <button disabled={state.loading} onClick={() => void inbox.load(true)}>
                    Tải thêm
                  </button>
                )}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
