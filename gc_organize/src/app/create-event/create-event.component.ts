import { Component, OnInit } from '@angular/core';
import { EventService } from '../services/event.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-event',
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.css'],
  imports: [FormsModule, CommonModule],
  providers: [EventService]
})
export class CreateEventComponent implements OnInit {
  isImageUploaded = false;
  event = {
    title: '',
    description: '',
    location: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: ''
    // Remove event_poster from here
  };
  eventPosterFile: File | null = null; // Add this
  role = localStorage.getItem('role');
  isEditMode = false;
  eventId: number | null = null;

  constructor(
    private eventService: EventService,
    private route: ActivatedRoute,
    private router: Router // <-- Inject Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['event_id']) {
        this.isEditMode = true;
        this.eventId = +params['event_id'];
        this.loadEventDetails(this.eventId);
      }
    });
  }

  // Helper to format date as yyyy-MM-dd using local time
  private toDateInputValue(date: any): string {
    if (!date) return '';
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadEventDetails(eventId: number) {
    this.eventService.getEventById(eventId).subscribe(
      (res: any) => {
        const event = res.data ? res.data : res;
        this.event = {
          title: event.title || '',
          description: event.description || '',
          location: event.location || '',
          start_date: this.toDateInputValue(event.start_date),
          start_time: event.start_time ? event.start_time.substring(0, 5) : '',
          end_date: this.toDateInputValue(event.end_date),
          end_time: event.end_time ? event.end_time.substring(0, 5) : ''
        };
        // Optionally handle event poster preview here
      },
      (error) => {
        // Handle error
      }
    );
  }

  previewImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const previewContainer = document.getElementById('image-preview') as HTMLElement;
    const previewImg = document.getElementById('preview-img') as HTMLImageElement;

    if (file) {
      this.eventPosterFile = file; // Save file for upload
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          previewImg.src = e.target.result as string;
          previewContainer.classList.remove('hidden');
          this.isImageUploaded = true;
        }
      };
      reader.readAsDataURL(file);
    } else {
      this.eventPosterFile = null;
      previewContainer.classList.add('hidden');
      this.isImageUploaded = false;
    }
  }

  removeImage(): void {
    const previewContainer = document.getElementById('image-preview') as HTMLElement;
    const previewImg = document.getElementById('preview-img') as HTMLImageElement;
    const fileInput = document.getElementById('dropzone-file') as HTMLInputElement;

    previewImg.src = '';
    previewContainer.classList.add('hidden');
    fileInput.value = '';
    this.isImageUploaded = false;
    this.eventPosterFile = null; // Clear file
  }

  createEvent(): void {
    // Combine start date and time to a Date object using local time
    function parseLocalDateTime(dateStr: string, timeStr: string): Date {
      if (!dateStr || !timeStr) return new Date('');
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hour, minute] = timeStr.split(':').map(Number);
      return new Date(year, month - 1, day, hour, minute, 0, 0);
    }

    const startDateTime = parseLocalDateTime(this.event.start_date, this.event.start_time);
    const now = new Date();

    if (isNaN(startDateTime.getTime()) || startDateTime < now) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Start Date/Time',
        text: 'Start date and time must be in the future.',
        confirmButtonColor: '#d33'
      });
      return;
    }

    // Optionally, you can also check that end date/time is after start date/time
    if (this.event.end_date && this.event.end_time) {
      const endDateTime = parseLocalDateTime(this.event.end_date, this.event.end_time);
      if (endDateTime < startDateTime) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid End Date/Time',
          text: 'End date and time must be after the start date and time.',
          confirmButtonColor: '#d33'
        });
        return;
      }
    }

    if (this.isEditMode && this.eventId) {
      // Update event logic
      const formData = new FormData();
      formData.append('title', this.event.title);
      formData.append('description', this.event.description);
      formData.append('location', this.event.location);
      formData.append('start_date', this.event.start_date);
      formData.append('start_time', this.event.start_time);
      formData.append('end_date', this.event.end_date);
      formData.append('end_time', this.event.end_time);
      if (this.eventPosterFile) {
        formData.append('event_poster', this.eventPosterFile);
      }
      this.eventService.updateEvent(this.eventId, formData).subscribe(
        (response) => {
          Swal.fire('Success', 'Event updated successfully!', 'success').then(() => {
            this.router.navigate(['/sidebar/manage-event']); // <-- Redirect after update
          });
        },
        (error) => {
          Swal.fire('Error', 'Failed to update event.', 'error');
        }
      );
    } else {
      const formData = new FormData();
      formData.append('title', this.event.title);
      formData.append('description', this.event.description);
      formData.append('location', this.event.location);
      formData.append('start_date', this.event.start_date);
      formData.append('start_time', this.event.start_time);
      formData.append('end_date', this.event.end_date);
      formData.append('end_time', this.event.end_time);
      if (this.eventPosterFile) {
        formData.append('event_poster', this.eventPosterFile);
      }

      // Only append adminId if it exists and is valid
      const adminId = localStorage.getItem('adminId');
      if (adminId && adminId !== 'undefined' && adminId !== '') {
        formData.append('created_by_osws_id', adminId);
      }

      // Only append creatorId if it exists and is valid
      const creatorId = localStorage.getItem('creatorId');
      if (creatorId && creatorId !== 'undefined' && creatorId !== '') {
        formData.append('created_by_org_id', creatorId);
      }

      // Show loading indicator while creating the event
      Swal.fire({
        title: 'Creating Event...',
        text: 'Please wait while we save your event.',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      this.eventService.createEvent(formData).subscribe(
        (response) => {
          // Close loading and show success
          Swal.close();
          Swal.fire({
            icon: 'success',
            title: 'Event Created!',
            text: 'Your event has been created successfully.',
            confirmButtonColor: '#679436'
          }).then(() => {
            // Reset form fields
            this.event = {
              title: '',
              description: '',
              location: '',
              start_date: '',
              start_time: '',
              end_date: '',
              end_time: ''
            };
            this.removeImage();
          });
        },
        (error) => {
          console.error('Error creating event:', error);
          // Close loading and show error
          Swal.close();
          Swal.fire('Error', 'Failed to create event. Please try again.', 'error');
        }
      );
    }
  }

  cancelEdit(): void {
    this.router.navigate(['/sidebar/manage-event']);
  }
}
