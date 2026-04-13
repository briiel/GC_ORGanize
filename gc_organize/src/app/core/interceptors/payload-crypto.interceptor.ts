import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, mergeMap, catchError, throwError, map } from 'rxjs';
import { PayloadEncryptionService } from '../../services/encryption.service';

const ENCRYPTED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

export const payloadCryptoInterceptorFn: HttpInterceptorFn = (req, next) => {
  const enc = inject(PayloadEncryptionService);

  // Only apply crypto to our internal API
  const isApiTarget = req.url.includes('/api');
  if (!isApiTarget) {
    return next(req);
  }

  // Determine if the *body* needs encryption
  const shouldEncryptBody =
    ENCRYPTED_METHODS.includes(req.method) &&
    !(req.body instanceof FormData) &&
    !((req.headers.get('Content-Type') ?? '').includes('multipart/form-data')) &&
    req.body != null;

  // 1. Generate the single-use Session Key for this request
  const cryptoTransaction$ = from(enc.generateSessionKey()).pipe(
    mergeMap(({ aesKey, encryptedSessionKeyB64 }) => {
      
      // 2. Prepare the modified request headers
      let clonedReq = req.clone({
        setHeaders: { 'X-Session-Key': encryptedSessionKeyB64 }
      });

      // 3. Encrypt the body if there is one
      const reqReady$ = shouldEncryptBody 
        ? from(enc.encryptPayload(req.body, aesKey)).pipe(
            map(encryptedStr => clonedReq.clone({ 
              body: JSON.stringify(encryptedStr),
              setHeaders: { 'X-Encrypted': 'true', 'Content-Type': 'application/json' }
            }))
          )
        : from(Promise.resolve(clonedReq));

      // 4. Send the request
      return reqReady$.pipe(
        mergeMap(finalReq => 
          next(finalReq).pipe(
            // 5. Intercept the response
            mergeMap(event => {
              if (!(event instanceof HttpResponse)) return from(Promise.resolve(event));
              
              const body = event.body as any;
              
              // Only decrypt if it's the exact string wire format
              if (!body || typeof body !== 'string') return from(Promise.resolve(event));

              return from(
                enc.decryptPayload(body, aesKey).then(
                  decrypted => event.clone({ body: decrypted }),
                  err => {
                    console.error('[PayloadCrypto] Decrypt failed:', err);
                    return event; // pass through so caller sees something
                  }
                )
              );
            })
          )
        )
      );
    }),
    catchError(err => {
      console.error('[PayloadCrypto] Interceptor error:', err);
      return throwError(() => err);
    })
  );

  return cryptoTransaction$;
};
