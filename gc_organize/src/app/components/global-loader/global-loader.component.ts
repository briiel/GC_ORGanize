import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-global-loader',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    @if (loadingService.loading$ | async) {
      <div
        class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm"
        role="status"
        aria-live="polite"
        aria-label="Loading"
      >
        <div class="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#679436]"></div>
        <p class="mt-4 text-gray-600 font-medium">{{ loadingService.message$ | async }}</p>
      </div>
    }
  `
})
export class GlobalLoaderComponent {
  readonly loadingService = inject(LoadingService);
}
