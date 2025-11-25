import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface LatLon { lat: number; lon: number }

@Injectable({
  providedIn: 'root'
})
export class OsmService {
  // User-agent header is recommended by Nominatim usage policy but browsers set it.
  // We'll call the public Nominatim endpoint to resolve place name to coordinates.
  private nominatimUrl = 'https://nominatim.openstreetmap.org/search';

  // Cache for resolved named places to avoid repeated network calls
  private cache: Record<string, LatLon> = {};

  constructor(private http: HttpClient) {}

  // Query Nominatim for a place name and return lat/lon for the first match
  getPlaceCoordinates(place: string): Observable<LatLon | null> {
    const key = place.trim().toLowerCase();
    if (this.cache[key]) {
      return of(this.cache[key]);
    }

    const params = new URLSearchParams({ q: place, format: 'json', limit: '1' });
    const url = `${this.nominatimUrl}?${params.toString()}`;

    return this.http.get<any[]>(url).pipe(
      map(results => {
        if (!results || !results.length) return null;
        const r = results[0];
        const lat = parseFloat(r.lat);
        const lon = parseFloat(r.lon);
        const v = { lat, lon };
        this.cache[key] = v;
        return v;
      }),
      catchError(() => of(null))
    );
  }

  // Query Nominatim for multiple place suggestions (display_name + lat/lon)
  // Returns up to `limit` suggestions (default 5). Does not cache results.
  getPlaceSuggestions(place: string, limit: number = 5): Observable<Array<{ display_name: string; lat: number; lon: number }>> {
    const q = String(place || '').trim();
    if (!q) return of([]);
    const params = new URLSearchParams({ q: q, format: 'json', limit: String(limit) });
    const url = `${this.nominatimUrl}?${params.toString()}`;
    return this.http.get<any[]>(url).pipe(
      map(results => {
        if (!results || !results.length) return [];
        return results.map(r => ({ display_name: r.display_name || (r.name || ''), lat: parseFloat(r.lat), lon: parseFloat(r.lon) }));
      }),
      catchError(() => of([]))
    );
  }

  // Haversine distance in meters between two coordinates
  distanceMeters(a: LatLon, b: LatLon): number {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371000; // Earth radius in meters
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);

    const sinDlat = Math.sin(dLat / 2);
    const sinDlon = Math.sin(dLon / 2);
    const aa = sinDlat * sinDlat + Math.cos(lat1) * Math.cos(lat2) * sinDlon * sinDlon;
    const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
    return R * c;
  }

  // Reverse geocode coordinates to a human-readable address using Nominatim
  // Returns the `display_name` or null on failure.
  reverseLookup(lat: number, lon: number): Observable<string | null> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&addressdetails=0`;
    return this.http.get<any>(url).pipe(
      map(res => {
        if (!res) return null;
        return typeof res.display_name === 'string' ? res.display_name : null;
      }),
      catchError(() => of(null))
    );
  }
}
