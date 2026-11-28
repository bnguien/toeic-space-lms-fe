import { useEffect, useState, type ReactNode } from "react";
import { HubConnectionBuilder } from "@microsoft/signalr";
import { useAuthStore } from "@/modules/auth";
import { env } from "@/config/env";
import { notificationApi } from "./api";
import { toast } from "@/shared/components/ui/Toast/toast-store";
import { Inbox, type Notice } from "./inbox";
import { InboxContext } from "./context";

export function NotificationProvider({ children }: { children: ReactNode }) {
  const userId = useAuthStore((s) => (s.status === "authenticated" ? s.user?.id : null));
  const [session, setSession] = useState<{ id: string; inbox: Inbox } | null>(null);
  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    const inbox = new Inbox(notificationApi(controller.signal));

    const hub = new HubConnectionBuilder()
      .withUrl(env.apiBaseUrl + "/notification/hubs/notifications", {
        withCredentials: true,
        accessTokenFactory: () => {
          const auth = useAuthStore.getState();
          return auth.user?.id === userId ? (auth.accessToken ?? "") : "";
        },
      })
      .withAutomaticReconnect()
      .build();
    let timer: ReturnType<typeof setTimeout>;
    const retry = () => {
      if (!controller.signal.aborted) {
        clearTimeout(timer);
        timer = setTimeout(start, 5000);
      }
    };
    function start() {
      if (!controller.signal.aborted) void hub.start().then(inbox.refresh, retry);
    }
    const notified = new Set<string>();
    const onCreated = (item: Notice) => {
      if (controller.signal.aborted || useAuthStore.getState().user?.id !== userId) return;
      inbox.created(item);
      if (notified.has(item.id)) return;
      notified.add(item.id);
      toast.info([item.title, item.body].filter(Boolean).join(" — "), 10_000);
    };
    hub.on("NotificationCreated", onCreated);
    hub.on("UnreadCountChanged", inbox.countChanged);
    hub.onreconnected(inbox.refresh);
    hub.onclose(retry);
    // StrictMode may release this session before its first negotiate request.
    queueMicrotask(() => {
      if (controller.signal.aborted) return;
      setSession({ id: userId, inbox });
      inbox.refresh();
      start();
    });
    return () => {
      controller.abort();
      inbox.dispose();
      setSession(null);
      clearTimeout(timer);
      hub.off("NotificationCreated", onCreated);
      hub.off("UnreadCountChanged", inbox.countChanged);
      void hub.stop();
    };
  }, [userId]);
  return (
    <InboxContext.Provider value={session && session.id === userId ? session.inbox : null}>
      {children}
    </InboxContext.Provider>
  );
}
