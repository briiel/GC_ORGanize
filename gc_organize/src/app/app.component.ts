import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { routeAnimations } from './route-animations';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';
import { GlobalLoaderComponent } from './components/global-loader/global-loader.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, GlobalLoaderComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [routeAnimations]
})
export class AppComponent {
  title = 'gc_organize';

  private swUpdate = inject(SwUpdate);

  constructor() {
    if (this.swUpdate.isEnabled) {
      // When a new version of the app is ready, activate it and reload
      this.swUpdate.versionUpdates
        .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
        .subscribe(async () => {
          await this.swUpdate.activateUpdate();
          document.location.reload();
        });

      // When the SW enters an unrecoverable state (e.g. cached chunks no longer
      // exist on the server after a new deployment), force a full hard reload.
      // This is the direct cause of the "MIME type text/html" chunk load errors.
      this.swUpdate.unrecoverable.subscribe(() => {
        document.location.reload();
      });

      // Check for updates every minute so idle tabs catch new deployments quickly
      setInterval(() => {
        this.swUpdate.checkForUpdate().catch(() => { /* ignore if SW not reachable */ });
      }, 60 * 1000);
    }
  }

  prepareRoute(outlet: RouterOutlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData['animation'];
  }
}
