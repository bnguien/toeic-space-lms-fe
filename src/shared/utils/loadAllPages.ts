export async function loadAllPages<T>(
  fetchPage: (page: number) => Promise<{ items: T[]; totalCount: number; pageSize: number }>,
) {
  const items: T[] = [];
  for (let page = 1; ; page++) {
    const result = await fetchPage(page);
    items.push(...result.items);
    if (!result.items.length || page * result.pageSize >= result.totalCount) return items;
  }
}
