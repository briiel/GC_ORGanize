import { Component } from '@angular/core';
import { EventService } from '../services/event.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-event',
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.css'],
  imports: [FormsModule, CommonModule],
  providers: [EventService]
})
export class CreateEventComponent {
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

  constructor(private eventService: EventService) {}

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
    // Combine start date and time to a Date object
    const startDateTime = new Date(`${this.event.start_date}T${this.event.start_time}`);
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
      const endDateTime = new Date(`${this.event.end_date}T${this.event.end_time}`);
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

    this.eventService.createEvent(formData).subscribe(
      (response) => {
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
        Swal.fire('Error', 'Failed to create event. Please try again.', 'error');
      }
    );
  }
}
