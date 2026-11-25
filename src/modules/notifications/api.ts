import { httpClient } from "@/services/http/httpClient";
import type { Notice, Page } from "./inbox";

const base = "/notification/api/v1/notifications";
export function notificationApi(signal: AbortSignal) {
  return {
    async list(pageIndex: number, unread: boolean, type?: string) {
      return (
        await httpClient.get<Page>(base, {
          signal,
          params: { pageIndex, pageSize: 20, isRead: unread ? false : undefined, type },
        })
      ).data;
    },
    async count() {
      return (await httpClient.get<{ count: number }>(base + "/unread-count", { signal })).data
        .count;
    },
    async detail(id: string) {
      return (await httpClient.get<Notice>(base + "/" + encodeURIComponent(id), { signal })).data;
    },
    async read(id?: string) {
      await httpClient.patch(
        base + (id ? "/" + encodeURIComponent(id) + "/read" : "/read-all"),
        undefined,
        { signal },
      );
    },
  };
}
