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

  // Fallback coordinates (verify these once and replace with an exact value if available)
  // These are approximate coordinates for Olongapo area; replace with the official college lat/lon if you have it.
  private readonly fallbackOgC: LatLon = { lat: 14.8400, lon: 120.2820 };

  // Convenience: resolve the known place name for Olongapo Gordon College.
  // If Nominatim fails or returns nothing, fall back to the configured value above.
  getOlongapoGordonCollegeCoords(): Observable<LatLon | null> {
    return this.getPlaceCoordinates('Olongapo Gordon College').pipe(
      map(r => r || this.fallbackOgC),
      catchError(() => of(this.fallbackOgC))
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
}
