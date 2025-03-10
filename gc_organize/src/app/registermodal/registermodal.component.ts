import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-registermodal',
  templateUrl: './registermodal.component.html',
  styleUrls: ['./registermodal.component.css'],
  imports: [CommonModule]
})
export class RegistermodalComponent {
  @Output() close = new EventEmitter<void>();
  imageSrcs: string[] = [];

  previewImages(event: any) {
    const files = event.target.files;
    if (files) {
      for (let file of files) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imageSrcs.push(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  triggerFileInput() {
    const fileInput = document.getElementById('hidden-file-input') as HTMLInputElement;
    fileInput.click();
  }

  removeImage(index: number) {
    this.imageSrcs.splice(index, 1);
  }

  removeAllImages() {
    this.imageSrcs = [];
  }

  closeModal(): void {
    this.close.emit();
  }
}
