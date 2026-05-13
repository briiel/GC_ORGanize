/** True when the string is only a "lat, lon" pair (hides from UI; still stored server-side). */
export function isLikelyLatLonPairString(s: string | null | undefined): boolean {
	if (s == null || typeof s !== 'string') return false;
	const t = s.trim();
	return /^-?\d{1,3}(?:\.\d+)?\s*,\s*-?\d{1,3}(?:\.\d+)?$/.test(t);
}

/** One line for a location row: prefers name/room; never returns raw coordinate pairs. */
export function primaryLocationLabel(loc: any, eventLocation?: string | null): string {
	const pick = (v: unknown): string | null => {
		if (v == null) return null;
		const t = String(v).trim();
		if (!t || isLikelyLatLonPairString(t)) return null;
		return t;
	};
	return (
		pick(loc?.name) ??
		pick(loc?.location_name) ??
		pick(loc?.room) ??
		pick(loc?.location) ??
		pick(eventLocation) ??
		'Map location'
	);
}

/** Card/table summary for an event (first human-readable location + optional "+N more"). */
export function eventLocationSummary(event: any): string {
	if (!event) return '—';
	const locs = event.locations;
	if (locs && Array.isArray(locs) && locs.length > 0) {
		const first = primaryLocationLabel(locs[0], event.location);
		const more = locs.length > 1 ? ` (+${locs.length - 1} more)` : '';
		return `${first}${more}`;
	}
	const room = event.room != null ? String(event.room).trim() : '';
	const loc = event.location != null ? String(event.location).trim() : '';
	if (room && !isLikelyLatLonPairString(room)) return room;
	if (loc && !isLikelyLatLonPairString(loc)) return loc;
	if (room) return room;
	if (loc && isLikelyLatLonPairString(loc)) return 'Map location';
	return loc || room || '—';
}
