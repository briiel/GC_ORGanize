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
  
  imageSrcs: string[] = []; // For display only (single image)
  selectedFile: File | null = null; // Store single file for upload

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
    student_id: ''
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
    if (files && files.length > 0) {
      const file = files[0];
      
      // Validate file size (5MB = 5 * 1024 * 1024 bytes)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        Swal.fire({
          icon: 'error',
          title: 'File Too Large',
          text: 'Please select an image smaller than 5MB.',
        });
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid File Type',
          text: 'Please select a JPEG, PNG, or WebP image.',
        });
        return;
      }

      // Clear previous selections and set new file
      this.imageSrcs = [];
      this.selectedFile = file;
      
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imageSrcs = [e.target.result]; // Single image
      };
      reader.readAsDataURL(file);
    }
  }

  triggerFileInput() {
    const fileInput = document.getElementById('hidden-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  removeImage(index: number) {
    this.imageSrcs = [];
    this.selectedFile = null;
    
    // Clear both file inputs
    const dropzoneInput = document.getElementById('dropzone-file') as HTMLInputElement;
    const hiddenInput = document.getElementById('hidden-file-input') as HTMLInputElement;
    
    if (dropzoneInput) dropzoneInput.value = '';
    if (hiddenInput) hiddenInput.value = '';
  }

  removeAllImages() {
    this.removeImage(0);
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

    // Validate required fields
    if (!this.registrationData.event_id || !this.registrationData.student_id) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Information',
        text: 'Event ID and Student ID are required.',
      });
      return;
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('event_id', this.registrationData.event_id.toString());
    formData.append('student_id', this.registrationData.student_id.toString());
    // Append proof of payment only if provided
    if (this.selectedFile) {
      formData.append('proof_of_payment', this.selectedFile);
    }

    // Show loading indicator
    Swal.fire({
      title: 'Processing Registration...',
      text: 'Please wait while we process your registration.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.http.post(
  // Dev: 'http://localhost:5000/api/event/events/register',
  'https://gcorg-apiv1-8bn5.onrender.com/api/event/events/register',
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`
          // Don't set Content-Type - let browser handle it for FormData
        }
      }
    ).subscribe({
      next: (res: any) => {
        Swal.fire({
          icon: 'success',
          title: 'Registration Successful!',
          html: `
            <p>You have been successfully registered for the event.</p>
          `,
          confirmButtonColor: '#679436',
          confirmButtonText: 'Got it!'
        }).then(() => {
          this.closeModal();
        });
      },
      error: (err) => {
        console.error('Registration error:', err);
        let errorMessage = 'An error occurred during registration.';
        
        if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (err.message) {
          errorMessage = err.message;
        } else if (err.status === 413) {
          errorMessage = 'File too large. Please upload an image smaller than 5MB.';
        } else if (err.status === 400) {
          errorMessage = 'Invalid file format. Please upload a JPEG, PNG, or WebP image.';
        }
        
        Swal.fire({
          icon: 'error',
          title: 'Registration Failed',
          text: errorMessage,
          confirmButtonColor: '#679436'
        });
      }
    });
  }

  closeModal(): void {
    this.close.emit();
  }
}