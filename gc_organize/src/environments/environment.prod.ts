// Production environment
export const environment = {
  production: true,
  apiUrl: 'https://gcorg-apiv1-8bn5.onrender.com/api',
  // Default geofence radius in meters (used when an event-specific radius is not set)
  // Increased from 200 to 1000 to cover the Gordon College campus perimeter.
  defaultGeofenceMeters: 1000
  ,
  // Keep bypass disabled in production
  attendanceGeofenceBypass: false
};
