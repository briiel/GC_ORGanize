import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-registermodal',
  templateUrl: './registermodal.component.html',
  styleUrls: ['./registermodal.component.css'],
  imports: [CommonModule, FormsModule]
})
export class RegistermodalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Input() eventId: number | null = null;
  imageSrcs: string[] = [];

  registrationData: any = {
    event_id: '',
    student_id: '',
    first_name: '',
    last_name: '',
    suffix: '',
    domain_email: '',
    department: '',
    program: '',
    proof_of_payment: ''
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    if (this.eventId !== null) {
      this.registrationData.event_id = this.eventId;
    }
  }

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

  submitRegistration() {
    const token = localStorage.getItem('authToken');  // or sessionStorage.getItem('token')
    if (!token) {
      alert('You must be logged in to register.');
      return;
    }

    this.http.post(
      'http://localhost:5000/api/event/events/register', // <-- Make sure this matches your backend route!
      this.registrationData,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    ).subscribe({
      next: (res) => {
        alert('Registration successful!');
        this.closeModal();
      },
      error: (err) => {
        alert('Registration failed: ' + (err.error?.message || err.message));
      }
    });
  }

  closeModal(): void {
    this.close.emit();
  }
}
