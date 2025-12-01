// Small helper utilities to normalize API responses
export function normalizeList(res: any): any[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.items)) return res.items;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.events)) return res.events;
  // Some endpoints return { items: [{ ... }] } when single; guard against that
  if (res.items && Array.isArray(res.items.data)) return res.items.data;
  return [];
}

export function normalizeSingle(res: any): any {
  if (!res) return null;
  if (Array.isArray(res) && res.length) return res[0];
  if (res && Array.isArray(res.items)) return res.items.length ? res.items[0] : null;
  if (res && Array.isArray(res.data)) return res.data.length ? res.data[0] : null;
  // Some endpoints return an object directly (data or the object itself)
  if (res?.data && typeof res.data === 'object' && !Array.isArray(res.data)) return res.data;
  return typeof res === 'object' ? res : null;
}
