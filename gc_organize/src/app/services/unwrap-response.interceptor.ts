import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpHandler, HttpRequest, HttpEvent, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UnwrapResponseInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      map((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse && event.body && typeof event.body === 'object') {
          const body = event.body as any;
          // If server returned a success envelope, unwrap it to the inner data
          if (body.success === true && body.hasOwnProperty('data')) {
            return event.clone({ body: body.data });
          }

          // If server returned an error envelope but with HTTP 200, convert it
          // into an HttpErrorResponse so callers hit the error path instead
          // of receiving the envelope as data (which causes .filter errors, etc.).
          if (body.success === false) {
            const message = body.message || 'API returned an error';
            throw new HttpErrorResponse({
              error: body,
              status: body.statusCode || 400,
              statusText: message,
              url: event.url || undefined
            });
          }
        }

        return event;
      })
    );
  }
}
