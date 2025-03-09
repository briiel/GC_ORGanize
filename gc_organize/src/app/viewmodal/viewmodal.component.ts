import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-viewmodal',
  imports: [],
  templateUrl: './viewmodal.component.html',
  styleUrl: './viewmodal.component.css'
})
export class ViewmodalComponent {
  @Output() close = new EventEmitter<void>();

  closeModal() {
    this.close.emit();
  }
}

