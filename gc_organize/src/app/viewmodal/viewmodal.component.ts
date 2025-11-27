import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-viewmodal',
  imports: [CommonModule],
  templateUrl: './viewmodal.component.html',
  styleUrl: './viewmodal.component.css'
})
export class ViewmodalComponent {
  @Output() close = new EventEmitter<void>();
  imageUrl: string = '';

  @Input() event: any;

  closeModal() {
    this.close.emit();
  }

  // Close on ESC key for accessibility
  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.closeModal();
  }

  setImage(url: string) {
    this.imageUrl = url;
  }

  updateBackgroundImage($event: Event, bgElementId: string): void {
    const imgElement = $event.target as HTMLImageElement;
    const bgElement = document.getElementById(bgElementId);
    if (bgElement && imgElement) {
      bgElement.style.backgroundImage = `url('${imgElement.src}')`;
    }
  }

  formatTime(timeString: string | null | undefined): string {
    if (!timeString) return '';
    const parts = timeString.split(':');
    if (parts.length < 2) return '';
    const [hours, minutes] = parts;
    // Use local time for formatting
    const now = new Date();
    const localDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), +hours, +minutes, 0, 0);
    return localDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  getPosterUrl(): string {
    if (!this.event?.event_poster) return '#';
    if (this.event.event_poster.startsWith('http')) return this.event.event_poster;
    // For relative paths, construct URL using environment base URL
    const baseUrl = environment.apiUrl.replace('/api', '');
    return `${baseUrl}/${this.event.event_poster.replace(/^\/*/, '')}`;
  }

  // Helper to get display status
  getDisplayStatus(): string {
    // Prefer server-provided auto_status (time-based) when available so the UI
    // matches backend dashboard counts and logic.
    return String(this.event?.auto_status || this.event?.status || '').toLowerCase();
  }
}

