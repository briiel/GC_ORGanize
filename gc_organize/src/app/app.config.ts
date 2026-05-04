import { ApplicationConfig, provideZoneChangeDetection, ErrorHandler } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import {
  provideHttpClient,
  withInterceptors,
  withInterceptorsFromDi,
  HTTP_INTERCEPTORS
} from '@angular/common/http';
import { AuthInterceptor } from './services/auth-interceptor.service';
import { UnwrapResponseInterceptor } from './services/unwrap-response.interceptor';
import { payloadCryptoInterceptorFn } from './core/interceptors/payload-crypto.interceptor';

import { routes } from './app.routes';
import { GlobalErrorHandler } from './core/errors/global-error-handler';

// Interceptor order: Auth → Unwrap (outermost, via DI) → payloadCrypto (innermost, via withInterceptors)
// Response path (server → payloadCrypto decrypts → Unwrap extracts data → Auth passes through)
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' })
    ),
    // Class-based interceptors run first on requests (outermost)
    provideHttpClient(
      withInterceptorsFromDi(),          // Auth → Unwrap (outermost wrappers)
      withInterceptors([payloadCryptoInterceptorFn]) // Crypto (innermost — first on responses)
    ),
    // 1. Attaches Bearer token
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    // 2. Unwraps { success, data } API envelope
    { provide: HTTP_INTERCEPTORS, useClass: UnwrapResponseInterceptor, multi: true },
    // 3. Global Error Handler for chunk loading issues
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ]
};
