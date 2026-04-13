// Production environment
export const environment = {
  production: true,
  apiUrl: 'https://gcorg-apiv1-8bn5.onrender.com/api',
  // Default geofence radius in meters (used when an event-specific radius is not set)
  // Reduced to 200m per recent change request.
  defaultGeofenceMeters: 200,
  // Keep bypass disabled in production
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
