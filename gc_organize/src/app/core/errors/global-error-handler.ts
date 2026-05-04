import { ErrorHandler, Injectable } from '@angular/core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    const msg = error.message ? String(error.message).toLowerCase() : '';
    const chunkFailedMessage = /loading chunk [\d]+ failed/;
    
    // Check for common signs of a chunk loading error (usually due to a new deployment)
    if (
      msg.includes('chunk load error') ||
      msg.includes('failed to fetch dynamically imported module') ||
      chunkFailedMessage.test(msg) ||
      msg.includes('loading chunk')
    ) {
      console.warn('Chunk load error detected (likely due to a new deployment). Reloading page...', error);
      window.location.reload();
      return;
    }
    
    // For all other errors, log them normally
    console.error(error);
  }
}
