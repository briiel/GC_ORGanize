import { Component } from '@angular/core';
import { EventService } from '../services/event.service';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
@Component({
  selector: 'app-create-event',
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.css'],
  imports: [FormsModule],
  providers: [EventService]
})
export class CreateEventComponent {
  isImageUploaded = false; // Track if an image is uploaded
  event = {
    title: '',
    description: '',
    location: '',
    event_date: '',
    event_time: '',
    event_poster: ''
  };

  constructor(private eventService: EventService) {} // Inject EventService

  previewImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const previewContainer = document.getElementById('image-preview') as HTMLElement;
    const previewImg = document.getElementById('preview-img') as HTMLImageElement;

    if (file) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          previewImg.src = e.target.result as string;
          previewContainer.classList.remove('hidden');
          this.isImageUploaded = true; // Hide file input
        }
      };
      reader.readAsDataURL(file);
    } else {
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
    fileInput.value = ''; // Clear the file input
    this.isImageUploaded = false; // Show file input
  }

  createEvent(): void {
    this.eventService.createEvent(this.event).subscribe(
      (response) => {
        console.log('Event successfully created:', response);
        alert('Event created successfully!');
        // Optionally, reset the form or navigate to another page
      },
      (error) => {
        console.error('Error creating event:', error);
        alert('Failed to create event. Please try again.');
      }
    );
  }
}
