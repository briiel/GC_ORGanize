import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

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
    const token = localStorage.getItem('authToken');
    if (!token) {
      Swal.fire({
        icon: 'warning',
        title: 'Not Logged In',
        text: 'You must be logged in to register.',
      });
      return;
    }

    this.http.post(
      'http://localhost:5000/api/event/events/register',
      this.registrationData,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    ).subscribe({
      next: (res) => {
        Swal.fire({
          icon: 'success',
          title: 'Registration Successful!',
          text: 'You have been registered for the event.',
          confirmButtonColor: '#679436'
        }).then(() => {
          this.closeModal();
        });
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Registration Failed',
          text: err.error?.message || err.message,
        });
      }
    });
  }

  closeModal(): void {
    this.close.emit();
  }
}
