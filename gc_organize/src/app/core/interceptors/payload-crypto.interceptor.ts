import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, mergeMap, catchError, throwError } from 'rxjs';
import { PayloadEncryptionService } from '../../services/encryption.service';

const ENCRYPTED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

export const payloadCryptoInterceptorFn: HttpInterceptorFn = (req, next) => {
  const enc = inject(PayloadEncryptionService);

  // Encrypt only state-changing requests with a non-FormData body
  const shouldEncrypt =
    ENCRYPTED_METHODS.includes(req.method) &&
    !(req.body instanceof FormData) &&
    !((req.headers.get('Content-Type') ?? '').includes('multipart/form-data')) &&
    req.body != null;

  // Build the (possibly encrypted) outgoing request
  const outgoing$ = shouldEncrypt
    ? from(
        enc.encrypt(req.body).then(encrypted =>
          req.clone({
            body: JSON.stringify(encrypted),
            setHeaders: { 'X-Encrypted': 'true', 'Content-Type': 'application/json' }
          })
        )
      )
    : from(Promise.resolve(req));

  return outgoing$.pipe(
    mergeMap(finalReq =>
      next(finalReq).pipe(
          // Decrypt each HttpResponse whose body is an encrypted payload envelope
        mergeMap(event => {
          if (!(event instanceof HttpResponse)) return from(Promise.resolve(event));
          const body = event.body as any;
          if (!body || typeof body !== 'string') return from(Promise.resolve(event));

          return from(
            enc.decrypt(body).then(
              decrypted => event.clone({ body: decrypted }),
              err => {
                console.error('[PayloadCrypto] Decrypt failed:', err);
                return event; // pass through so caller sees something
              }
            )
          );
        })
      )
    ),
    catchError(err => {
      console.error('[PayloadCrypto] Interceptor error:', err);
      return throwError(() => err);
    })
  );
};
