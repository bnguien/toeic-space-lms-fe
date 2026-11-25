export interface Notice {
  id: string;
  title: string;
  body: string;
  type: string;
  source: string;
  relatedEntityId: string | null;
  navigationPath: string | null;
  createdAt: string;
  readAt: string | null;
  isRead: boolean;
}
export interface Page {
  items: Notice[];
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
export interface InboxApi {
  list(page: number, unread: boolean): Promise<Page>;
  count(): Promise<number>;
  read(id?: string): Promise<void>;
}

function sorted(items: Notice[]) {
  return [...new Map(items.map((item) => [item.id, item])).values()].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || b.id.localeCompare(a.id),
  );
}

export class Inbox {
  private api: InboxApi;
  constructor(api: InboxApi) {
    this.api = api;
  }
  private listeners = new Set<() => void>();
  private pageVersion = 0;
  private countVersion = 0;
  private live = true;
  private state = {
    items: [] as Notice[],
    count: 0,
    open: false,
    unread: false,
    page: 0,
    more: false,
    loading: false,
    saving: false,
    listError: false,
    countError: false,
    saveError: false,
  };
  snapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private update(patch: Partial<typeof this.state>) {
    if (!this.live) return;
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn());
  }
  dispose() {
    this.live = false;
    this.listeners.clear();
  }
  async refreshCount() {
    const version = ++this.countVersion;
    try {
      const count = await this.api.count();
      if (version === this.countVersion) this.update({ count, countError: false });
    } catch {
      if (version === this.countVersion) this.update({ countError: true });
    }
  }
  async load(append = false) {
    if (!this.live || !this.state.open || (append && (this.state.loading || !this.state.more)))
      return;
    const version = ++this.pageVersion;
    const page = append ? this.state.page + 1 : 1;
    this.update({ loading: true, listError: false });
    try {
      const unread = this.state.unread;
      const lastPage = append ? page : Math.max(1, this.state.page);
      let result = await this.api.list(page, unread);
      const items = [...(append ? this.state.items : []), ...result.items];
      // Reconcile every visible page so a cross-tab read keeps the current scroll range.
      for (let next = page + 1; next <= lastPage && result.hasNextPage; next++) {
        if (!this.live || version !== this.pageVersion) return;
        result = await this.api.list(next, unread);
        items.push(...result.items);
      }
      if (version === this.pageVersion)
        this.update({
          items: sorted(items),
          page: result.pageIndex,
          more: result.hasNextPage,
          loading: false,
        });
    } catch {
      if (version === this.pageVersion) this.update({ loading: false, listError: true });
    }
  }
  refresh = () => {
    if (this.live) {
      void this.refreshCount();
      void this.load();
    }
  };
  open(value: boolean) {
    this.update({ open: value });
    if (value) this.refresh();
  }
  filter(unread: boolean) {
    if (unread === this.state.unread) return;
    this.update({ unread, items: [], page: 0, more: false });
    void this.load();
  }
  created = (item: Notice) => {
    if (!this.live || !this.state.open) return;
    if (!this.state.unread || !item.isRead)
      this.update({ items: sorted([item, ...this.state.items]) });
    // Restart an older request against the committed notification.
    if (this.state.loading) void this.load();
  };
  countChanged = ({ count }: { count: number }) => {
    ++this.countVersion;
    this.update({ count, countError: false });
    void this.load();
  };
  async mark(id?: string) {
    if (!this.live || this.state.saving) return false;
    if (id && this.state.items.find((i) => i.id === id)?.isRead) return true;
    const version = this.countVersion;
    this.update({ saving: true, saveError: false });
    try {
      await this.api.read(id);
      if (!this.live) return false;
      const items = this.state.items.map((item) =>
        !id || item.id === id ? { ...item, isRead: true } : item,
      );
      this.update({
        items: this.state.unread ? items.filter((i) => !i.isRead) : items,
        ...(version === this.countVersion
          ? { count: id ? Math.max(0, this.state.count - 1) : 0 }
          : {}),
      });
      this.refresh();
      return true;
    } catch {
      this.update({ saveError: true });
      return false;
    } finally {
      this.update({ saving: false });
    }
  }
}
