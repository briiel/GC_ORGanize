import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  @HostListener('document:keydown.escape', ['$event'])
  onEsc(event: KeyboardEvent) {
    event.preventDefault();
    this.closeModal();
  }

  setImage(url: string) {
    this.imageUrl = url;
  }

  updateBackgroundImage(event: Event, bgElementId: string): void {
    const imgElement = event.target as HTMLImageElement;
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
  // Dev: `http://localhost:5000/${this.event.event_poster.replace(/^\/+/, '')}`
  return `https://gcorg-apiv1-8bn5.onrender.com/${this.event.event_poster.replace(/^\/+/, '')}`;

  }

  // Helper to get display status
  getDisplayStatus(): string {
    return String(this.event?.status || '').toLowerCase();
  }
}

