// Development environment
export const environment = {
  production: false,
  // Use the current page hostname so mobile devices can reach the dev API
  // when opening the frontend via http://<dev-ip>:4200
  apiUrl: `http://${window.location.hostname}:5000/api`,
  // Default geofence radius in meters (used when an event-specific radius is not set)
  // Increased from 200 to 1000 to cover the Gordon College campus perimeter.
  defaultGeofenceMeters: 1000
  ,
  // Geofence bypass removed for all environments; always enforce geofence checks.
  attendanceGeofenceBypass: false
};
