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

  // For display only (not sent to backend)
  studentInfo: any = {
    id: '',
    first_name: '',
    last_name: '',
    middle_initial: '',
    email: '',
    suffix: '',
    department: '',
    program: ''
  };

  // Only these fields are sent to backend
  registrationData: any = {
    event_id: '',
    student_id: '',
    proof_of_payment: ''
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    if (this.eventId !== null) {
      this.registrationData.event_id = this.eventId;
    }
    // Auto-fill student info for display, but only send id to backend
    const studentInfoStr = localStorage.getItem('studentInfo');
    if (studentInfoStr) {
      const student = JSON.parse(studentInfoStr);
      this.studentInfo = {
        id: student.student_id || student.id || '',
        first_name: student.first_name || '',
        last_name: student.last_name || '',
        email: student.email || '',
        middle_initial: student.middle_initial || '',
        suffix: student.suffix || '',
        department: student.department || '',
        program: student.program || ''
      };
      this.registrationData.student_id = this.studentInfo.id;
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
      'https://gcorg-apiv1-8bn5.onrender.com/api/event/events/register',
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
