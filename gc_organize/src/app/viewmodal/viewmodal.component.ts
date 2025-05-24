import { Component, Input, Output, EventEmitter } from '@angular/core';
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
    const date = new Date();
    date.setHours(+hours, +minutes, 0, 0);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  getPosterUrl(): string {
    if (!this.event?.event_poster) return '#';
    if (this.event.event_poster.startsWith('http')) return this.event.event_poster;
    return `http://localhost:5000/${this.event.event_poster.replace(/^\/+/, '')}`;
  }
}

