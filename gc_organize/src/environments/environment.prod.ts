// Production environment
export const environment = {
  production: true,
  apiUrl: 'https://gcorg-apiv1-8bn5.onrender.com/api',
  // Default geofence radius in meters (used when an event-specific radius is not set)
  // Reduced to 200m per recent change request.
  defaultGeofenceMeters: 200,
  // Keep bypass disabled in production
  attendanceGeofenceBypass: false,
  // Shared AES-256-GCM key for transport-layer payload encryption.
  // Must match PAYLOAD_ENCRYPTION_KEY in the backend .env file (production secret).
  payloadEncryptionKey: 'e35abf211f6929ae7f358694fa56a0782b2375d1f004249eba5d8eaec50729f2'
};
