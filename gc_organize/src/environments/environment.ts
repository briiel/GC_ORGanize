// Development environment
export const environment = {
  production: false,
  // Use the current page hostname so mobile devices can reach the dev API
  // when opening the frontend via http://<dev-ip>:4200
  apiUrl: `http://${window.location.hostname}:5000/api`,
  // Default geofence radius in meters (used when an event-specific radius is not set)
  // Reduced to 200m per recent change request.
  defaultGeofenceMeters: 200,
  // Geofence bypass removed for all environments; always enforce geofence checks.
  attendanceGeofenceBypass: false,
  // Shared AES-256-GCM key for transport-layer payload encryption.
  // Must match PAYLOAD_ENCRYPTION_KEY in the backend .env file.
  payloadEncryptionKey: 'e35abf211f6929ae7f358694fa56a0782b2375d1f004249eba5d8eaec50729f2'
};
