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
  // RSA-2048 Public Key provided by the backend for Hybrid payload encryption.
  // It is perfectly safe for this to be visible in the frontend source code.
  backendPublicKey: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsCI14AlCK0x5BurOcsZd
BtDrMwJnaOmLTwAvoStuenox003xrh4UaQZIFNyHEBWQUJ9vvufQe9heknGK7uGm
moWeCdbtkPJ9CRrZ8uLC4gzBftE6hrEtwAc4EZwyeJ6B9xY0oz92DWT8HfGxCa20
UfaouY0sF4DuYehQj1+IN4wTKZi26I9tKINxqTTAPrZ39BkWCKL/OM/ESn1st4ZS
mnUQ8LtYHGGoMtQLV+jluD4QbyJ368DBe5tg/owghxwVcNLnO+IWFal2deAmTmpa
s/GWv+O3wf0sOVjGO64Qqlnuoh37NI045q8+HTi6wWUQcMvrGuOQfkSw8ZO3756y
CwIDAQAB
-----END PUBLIC KEY-----`
};
