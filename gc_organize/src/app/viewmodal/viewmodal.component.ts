import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-viewmodal',
  imports: [],
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
}

