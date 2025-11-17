import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { RbacAuthService } from '../services/rbac-auth.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-registermodal',
  standalone: true, 
  templateUrl: './registermodal.component.html',
  styleUrls: ['./registermodal.component.css'],
  imports: [CommonModule, FormsModule]
})
export class RegistermodalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Input() eventId: number | null = null;
  isPaid: boolean = false;
  
  // Proof of payment upload state
  proofPreviewUrl: string | null = null;
  selectedFile: File | null = null;

  // For display only
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

  constructor(
    private http: HttpClient,
    private authService: RbacAuthService
  ) {}

  ngOnInit(): void {
    if (this.eventId !== null) {
      this.registrationData.event_id = this.eventId;
    }
    
    // Fetch event to determine if paid
    if (this.eventId !== null) {
      const token = localStorage.getItem('gc_organize_token') || '';
      this.http.get<any>(`${environment.apiUrl}/event/events/${this.eventId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }).subscribe({
        next: (res) => {
          const ev = res?.data ? res.data : res;
          this.isPaid = !!ev?.is_paid;
        },
        error: () => {
          this.isPaid = false;
        }
      });
    }
    
    // Fetch student info from JWT token and backend
    this.loadStudentInfo();
  }

  private loadStudentInfo(): void {
    const token = this.authService.getToken();
    if (!token) {
      console.error('No authentication token found');
      Swal.fire({
        icon: 'error',
        title: 'Authentication Required',
        text: 'Please log in to register for events.',
        confirmButtonColor: '#679436'
      });
      this.closeModal();
      return;
    }

    const decoded = this.authService.getDecodedToken();
    console.log('[RegisterModal] Decoded token:', decoded);
    
    if (!decoded) {
      console.error('Invalid or expired token');
      Swal.fire({
        icon: 'error',
        title: 'Session Expired',
        text: 'Your session has expired. Please log in again.',
        confirmButtonColor: '#679436'
      });
      this.closeModal();
      return;
    }

    if (!decoded.studentId) {
      console.error('Not a student account - studentId missing from token');
      Swal.fire({
        icon: 'error',
        title: 'Access Denied',
        text: 'Only student accounts can register for events.',
        confirmButtonColor: '#679436'
      });
      this.closeModal();
      return;
    }

    // Set basic info from token
    this.studentInfo.id = decoded.studentId;
    this.studentInfo.first_name = decoded.firstName || '';
    this.studentInfo.last_name = decoded.lastName || '';
    this.studentInfo.email = decoded.email || '';
    this.registrationData.student_id = decoded.studentId;
    
    console.log('[RegisterModal] Student ID set to:', this.registrationData.student_id);

    // Fetch additional student details from backend
    this.http.get<any>(`${environment.apiUrl}/users/${decoded.studentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        const student = res?.data || res;
        if (student) {
          this.studentInfo = {
            id: student.id || decoded.studentId,
            first_name: student.first_name || decoded.firstName || '',
            last_name: student.last_name || decoded.lastName || '',
            middle_initial: student.middle_initial || '',
            email: student.email || decoded.email || '',
            suffix: student.suffix || '',
            department: student.department || '',
            program: student.program || ''
          };
          // Ensure student_id is still set even after backend fetch
          if (!this.registrationData.student_id) {
            this.registrationData.student_id = student.id || decoded.studentId;
          }
          console.log('[RegisterModal] Student info loaded:', this.studentInfo);
        }
      },
      error: (err) => {
        console.error('Error fetching student details:', err);
        // Continue with basic info from token - student_id is already set above
      }
    });
  }

  previewImages(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) {
      this.selectedFile = null;
      this.proofPreviewUrl = null;
      return;
    }

    // Validate file size (2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      Swal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'Please select an image smaller than 2MB.',
      });
      input.value = '';
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File Type',
        text: 'Only PNG, JPG, JPEG, or WEBP images are allowed.',
      });
      input.value = '';
      return;
    }

    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (e.target?.result) {
        this.proofPreviewUrl = e.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('pop-dropzone-file') as HTMLInputElement;
    fileInput?.click();
  }

  removeImage(): void {
    this.selectedFile = null;
    this.proofPreviewUrl = null;
    const dropzoneInput = document.getElementById('pop-dropzone-file') as HTMLInputElement | null;
    if (dropzoneInput) {
      dropzoneInput.value = '';
    }
  }

  removeAllImages(): void {
    this.removeImage();
  }

  submitRegistration(): void {
    const token = localStorage.getItem('gc_organize_token');
    if (!token) {
      Swal.fire({
        icon: 'warning',
        title: 'Not Logged In',
        text: 'You must be logged in to register.',
      });
      return;
    }

    // Validate required fields with detailed logging
    console.log('[RegisterModal] Validation - event_id:', this.registrationData.event_id);
    console.log('[RegisterModal] Validation - student_id:', this.registrationData.student_id);
    
    if (!this.registrationData.event_id || !this.registrationData.student_id) {
      console.error('[RegisterModal] Validation failed - Missing required fields:', {
        event_id: this.registrationData.event_id,
        student_id: this.registrationData.student_id,
        eventId_input: this.eventId,
        studentInfo: this.studentInfo
      });
      
      Swal.fire({
        icon: 'error',
        title: 'Missing Information',
        html: `<p>Registration failed due to missing information:</p>
               <ul style="text-align: left; margin-top: 10px;">
                 <li>Event ID: ${this.registrationData.event_id || '<span style="color:red;">Missing</span>'}</li>
                 <li>Student ID: ${this.registrationData.student_id || '<span style="color:red;">Missing</span>'}</li>
               </ul>
               <p style="margin-top: 10px;">Please try logging out and logging in again.</p>`,
        confirmButtonColor: '#679436'
      });
      return;
    }

    // If paid event, require proof
    if (this.isPaid && !this.selectedFile) {
      Swal.fire({
        icon: 'warning',
        title: 'Proof Required',
        text: 'Please upload a proof of payment for this paid event.'
      });
      return;
    }

    // Create FormData
    const formData = new FormData();
    formData.append('event_id', this.registrationData.event_id.toString());
    formData.append('student_id', this.registrationData.student_id.toString());
    
    if (this.selectedFile) {
      formData.append('proof_of_payment', this.selectedFile);
    }

    // Show loading
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
      `${environment.apiUrl}/event/events/register`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    ).subscribe({
      next: (res: any) => {
        const message = this.isPaid
          ? 'Your registration was submitted and is pending approval by the organizer.'
          : 'You have been successfully registered. Your QR code is available in your registrations.';
        Swal.fire({
          icon: 'success',
          title: 'Registration Submitted',
          html: `<p>${message}</p>`,
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
          errorMessage = 'File too large. Please upload an image smaller than 2MB.';
        } else if (err.status === 400) {
          errorMessage = 'Invalid file format. Only PNG, JPG, JPEG, or WEBP images are allowed.';
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

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.closeModal();
  }
}