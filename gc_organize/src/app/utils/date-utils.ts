export function parseMysqlDatetimeToDate(value: string | Date | null | undefined): Date | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  const s = String(value).trim();

  // Match full MySQL DATETIME: YYYY-MM-DD HH:MM:SS or with T
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/);
  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]) - 1;
    const day = Number(m[3]);
    const hour = Number(m[4]);
    const minute = Number(m[5]);
    const second = Number(m[6]);
    return new Date(Date.UTC(year, month, day, hour, minute, second));
  }

  // Match date-only: YYYY-MM-DD
  const dOnly = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dOnly) {
    const year = Number(dOnly[1]);
    const month = Number(dOnly[2]) - 1;
    const day = Number(dOnly[3]);
    return new Date(Date.UTC(year, month, day, 0, 0, 0));
  }

  // ISO with timezone or Z - safe to pass through
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  // Plain ISO without timezone (contains 'T' but no offset) - treat as UTC
  if (s.includes('T')) {
    try {
      const d = new Date(s + 'Z');
      if (!isNaN(d.getTime())) return d;
    } catch (_) { /* fall through */ }
  }

  // Fallback: try Date constructor (may treat as local)
  try {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  } catch (_e) {
    return null;
  }
}

export function formatToLocalShort(d: Date | null, options?: Intl.DateTimeFormatOptions): string {
  if (!d) return '-';
  return new Intl.DateTimeFormat(undefined, Object.assign({
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  }, options || {})).format(d);
}
