import { bootstrapApplication } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { importProvidersFrom, isDevMode } from '@angular/core';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { IMAGE_CONFIG } from '@angular/common';
import { provideServiceWorker } from '@angular/service-worker';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideRouter(routes),
    importProvidersFrom(BrowserAnimationsModule),
    {
    provide: IMAGE_CONFIG,
    useValue: {
      disableImageSizeWarning: true, 
      disableImageLazyLoadWarning: true
    }
  }, provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          }), provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          }), provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          }),
  ]
}).catch((err) => console.error(err));
