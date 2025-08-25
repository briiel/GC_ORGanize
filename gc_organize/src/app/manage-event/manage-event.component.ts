import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- Add this import
import { EventService } from '../services/event.service';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'app-manage-event',
  templateUrl: './manage-event.component.html',
  styleUrls: ['./manage-event.component.css'],
  imports: [CommonModule, FormsModule]
})
export class ManageEventComponent implements OnInit, OnDestroy {
  events: any[] = [];
  oswsEvents: any[] = [];
  orgEvents: any[] = [];
  creatorId: number;
  adminId: number;
  searchTerm: string = '';
  statusFilter: string = '';
  filteredList: any[] = [];
  isOsws: boolean = false;
  orgEventsSearchTerm: string = '';
  filteredOrgEventsList: any[] = [];

  showParticipantsModal = false;
  participants: any[] = [];
  participantsLoading = false;
  selectedEventTitle = '';

  // Create Event modal state
  showCreateModal = false;
  isImageUploaded = false;
  eventPosterFile: File | null = null;
  posterPreviewUrl: string | null = null;
  isEditing = false;
  editingEventId: number | null = null;
  newEvent = {
    title: '',
    description: '',
    location: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: ''
  };

  constructor(private eventService: EventService, private router: Router) {
    // Get creator/org ID from localStorage or AuthService
    this.creatorId = Number(localStorage.getItem('creatorId'));
    this.adminId = Number(localStorage.getItem('adminId'));
    this.isOsws = localStorage.getItem('role') === 'osws_admin';
  }

  ngOnInit() {
    if (this.isOsws) {
      this.fetchOswsEvents();
      this.fetchOrgEvents();
    } else {
      this.fetchEvents();
    }
  }

  ngOnDestroy(): void {
    // Ensure body class is cleared when component is destroyed
    document.body.classList.remove('modal-open');
  }

  fetchEvents() {
    this.eventService.getEventsByCreator(this.creatorId).subscribe({
      next: (res) => {
        this.events = res.data || res;
        this.filteredList = this.events;
      },
      error: (err) => {
        console.error('Error fetching events:', err);
      }
    });
  }

  fetchOswsEvents() {
    if (!this.adminId) return;
    this.eventService.getEventsByAdmin(this.adminId).subscribe({
      next: (res) => {
        this.oswsEvents = res.data || res;
      },
      error: (err) => {
        console.error('Error fetching OSWS events:', err);
      }
    });
  }

  fetchOrgEvents() {
    this.eventService.getAllOrgEvents().subscribe({
      next: (res) => {
        this.orgEvents = res.data || res;
        this.filteredOrgEventsList = this.orgEvents;
      },
      error: (err) => {
        console.error('Error fetching org events:', err);
      }
    });
  }

  updateEventStatus(event: any) {
    this.eventService.updateEventStatus(event.event_id, event.status).subscribe({
      next: () => {},
      error: (err) => {
        console.error('Error updating event status:', err);
      }
    });
  }

  updateOswsEventStatus(event: any) {
    this.updateEventStatus(event);
  }

  formatTime(timeString: string | null | undefined): string {
    if (!timeString) return '';
    const parts = timeString.split(':');
    if (parts.length < 2) return '';
    const [hours, minutes] = parts;
    const date = new Date();
    date.setHours(+hours, +minutes, 0, 0);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  searchEvents() {
    // For OSWS, search both tables
    if (this.isOsws) {
      // Optionally implement search for both tables if needed
    } else {
      this.filteredList = this.events.filter(event => {
        const search = this.searchTerm.trim().toLowerCase();
        const matchesSearch =
          !search ||
          event.title.toLowerCase().includes(search) ||
          event.location.toLowerCase().includes(search) ||
          (event.event_date && (new Date(event.event_date).toLocaleDateString().toLowerCase().includes(search)));
        const matchesStatus =
          !this.statusFilter || event.status === this.statusFilter;
        return matchesSearch && matchesStatus;
      });
    }
  }

  clearSearch() {
    this.searchTerm = '';
    // Optionally, reset other filters if needed
  }

  filteredEvents() {
    return this.filteredList;
  }

  searchOrgEvents() {
    const term = this.orgEventsSearchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredOrgEventsList = this.orgEvents;
      return;
    }
    this.filteredOrgEventsList = this.orgEvents.filter(event =>
      (event.title && event.title.toLowerCase().includes(term)) ||
      (event.location && event.location.toLowerCase().includes(term)) ||
      (event.department && event.department.toLowerCase().includes(term)) || // <-- Add department
      (event.start_date && new Date(event.start_date).toLocaleDateString().toLowerCase().includes(term)) ||
      (event.end_date && new Date(event.end_date).toLocaleDateString().toLowerCase().includes(term))
    );
  }

  clearOrgEventsSearch() {
    this.orgEventsSearchTerm = '';
    this.filteredOrgEventsList = this.orgEvents;
  }

  filteredOrgEvents() {
    return this.filteredOrgEventsList || [];
  }

  filteredOswsEvents(): any[] {
    if (!this.searchTerm) return this.oswsEvents;
    const term = this.searchTerm.toLowerCase();
    return this.oswsEvents.filter(event =>
      (event.title && event.title.toLowerCase().includes(term)) ||
      (event.location && event.location.toLowerCase().includes(term)) ||
      (event.start_date && event.start_date.toLowerCase().includes(term)) ||
      (event.end_date && event.end_date.toLowerCase().includes(term))
    );
  }

  confirmDeleteEvent(event: any) {
    Swal.fire({
      title: 'Are you sure?',
      text: `Move event "${event.title}" to trash?`,
      icon: 'warning',
      showCancelButton: true,
  confirmButtonText: 'Delete',
  cancelButtonText: 'Cancel',
  confirmButtonColor: '#d33',
  reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteEvent(event.event_id);
      }
    });
  }

  deleteEvent(eventId: number) {
    this.eventService.deleteEvent(eventId).subscribe({
      next: () => {
        if (this.isOsws) {
          this.fetchOswsEvents();
          this.fetchOrgEvents();
        } else {
          this.fetchEvents();
        }
      },
      error: (err) => {
        Swal.fire('Error', 'Failed to delete event.', 'error');
        console.error('Error deleting event:', err);
      }
    });
  }

  openParticipantsModal(event: any) {
    this.selectedEventTitle = event.title;
    this.showParticipantsModal = true;
    this.participantsLoading = true;
    this.participants = [];
  this.toggleBodyModalClass();
    this.eventService.getEventParticipants(event.event_id).subscribe({
      next: (res) => {
        this.participants = res.data || res;
        this.participantsLoading = false;
      },
      error: () => {
        this.participants = [];
        this.participantsLoading = false;
      }
    });
  }

  closeParticipantsModal() {
    this.showParticipantsModal = false;
    this.participants = [];
    this.selectedEventTitle = '';
  this.toggleBodyModalClass();
  }

  editEvent(event: any) {
    // Open modal and load full event details
    this.openEditModal(event.event_id);
  }

  // Open Create Event modal
  openCreateModal() {
    // reset form
    this.newEvent = { title: '', description: '', location: '', start_date: '', start_time: '', end_date: '', end_time: '' };
    this.isImageUploaded = false;
    this.eventPosterFile = null;
    this.posterPreviewUrl = null;
    this.isEditing = false;
    this.editingEventId = null;
    // clear any preview elements if present in DOM (best-effort)
    const previewContainer = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img') as HTMLImageElement | null;
    if (previewContainer) previewContainer.classList.add('hidden');
    if (previewImg) previewImg.src = '';
    const fileInput = document.getElementById('dropzone-file') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';
    this.showCreateModal = true;
  this.toggleBodyModalClass();
  }

  closeCreateModal() {
    this.showCreateModal = false;
  this.toggleBodyModalClass();
  }

  openEditModal(eventId: number) {
    this.isEditing = true;
    this.editingEventId = eventId;
    this.showCreateModal = true;
  this.toggleBodyModalClass();
    this.isImageUploaded = false;
    this.eventPosterFile = null;
    this.posterPreviewUrl = null;
    // Load event details from API to ensure all fields
    this.eventService.getEventById(eventId).subscribe({
      next: (res: any) => {
        const event = res?.data ? res.data : res;
        this.newEvent = {
          title: event.title || '',
          description: event.description || '',
          location: event.location || '',
          start_date: event.start_date ? String(event.start_date).substring(0, 10) : '',
          start_time: event.start_time ? String(event.start_time).substring(0, 5) : '',
          end_date: event.end_date ? String(event.end_date).substring(0, 10) : '',
          end_time: event.end_time ? String(event.end_time).substring(0, 5) : ''
        };
        // If backend returns poster URL, show it
        const poster = event.event_poster || event.poster || event.poster_url || event.image_url;
        if (poster && typeof poster === 'string') {
          this.posterPreviewUrl = poster;
          this.isImageUploaded = true;
        }
      },
      error: (err) => {
        console.error('Failed to load event details', err);
      }
    });
  }

  private toggleBodyModalClass() {
    const hasOpenModal = this.showCreateModal || this.showParticipantsModal;
    document.body.classList.toggle('modal-open', hasOpenModal);
  }

  // Image preview handlers (mirrors CreateEventComponent)
  previewImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    const previewContainer = document.getElementById('image-preview') as HTMLElement | null;
    const previewImg = document.getElementById('preview-img') as HTMLImageElement | null;

    if (file) {
      this.eventPosterFile = file;
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          this.posterPreviewUrl = e.target.result as string;
          if (previewImg) previewImg.src = this.posterPreviewUrl;
          if (previewContainer) previewContainer.classList.remove('hidden');
          this.isImageUploaded = true;
        }
      };
      reader.readAsDataURL(file);
    } else {
      this.eventPosterFile = null;
      if (previewContainer) previewContainer.classList.add('hidden');
      this.isImageUploaded = false;
      this.posterPreviewUrl = null;
    }
  }

  removeImage(): void {
    const previewContainer = document.getElementById('image-preview') as HTMLElement | null;
    const previewImg = document.getElementById('preview-img') as HTMLImageElement | null;
    const fileInput = document.getElementById('dropzone-file') as HTMLInputElement | null;

    if (previewImg) previewImg.src = '';
    if (previewContainer) previewContainer.classList.add('hidden');
    if (fileInput) fileInput.value = '';
    this.isImageUploaded = false;
    this.eventPosterFile = null;
  this.posterPreviewUrl = null;
  }

  createEventFromModal(): void {
    // Validate start date/time in the future
    const startDateTime = new Date(`${this.newEvent.start_date}T${this.newEvent.start_time}`);
    const now = new Date();
    if (isNaN(startDateTime.getTime()) || startDateTime < now) {
      Swal.fire({ icon: 'error', title: 'Invalid Start Date/Time', text: 'Start date and time must be in the future.', confirmButtonColor: '#d33' });
      return;
    }

    // Validate end after start if provided
    if (this.newEvent.end_date && this.newEvent.end_time) {
      const endDateTime = new Date(`${this.newEvent.end_date}T${this.newEvent.end_time}`);
      if (endDateTime < startDateTime) {
        Swal.fire({ icon: 'error', title: 'Invalid End Date/Time', text: 'End date and time must be after the start date and time.', confirmButtonColor: '#d33' });
        return;
      }
    }

    const formData = new FormData();
    formData.append('title', this.newEvent.title);
    formData.append('description', this.newEvent.description);
    formData.append('location', this.newEvent.location);
    formData.append('start_date', this.newEvent.start_date);
    formData.append('start_time', this.newEvent.start_time);
    formData.append('end_date', this.newEvent.end_date);
    formData.append('end_time', this.newEvent.end_time);
    if (this.eventPosterFile) {
      formData.append('event_poster', this.eventPosterFile);
    }

    if (this.isEditing && this.editingEventId) {
      Swal.fire({ title: 'Updating Event...', text: 'Please wait while we update your event.', allowOutsideClick: false, allowEscapeKey: false, showConfirmButton: false, didOpen: () => Swal.showLoading() });
      this.eventService.updateEvent(this.editingEventId, formData).subscribe({
        next: () => {
          Swal.close();
          Swal.fire('Success', 'Event updated successfully!', 'success').then(() => {
            this.closeCreateModal();
            if (this.isOsws) {
              this.fetchOswsEvents();
              this.fetchOrgEvents();
            } else {
              this.fetchEvents();
            }
          });
        },
        error: (error) => {
          console.error('Error updating event:', error);
          Swal.close();
          Swal.fire('Error', 'Failed to update event.', 'error');
        }
      });
    } else {
      const adminId = localStorage.getItem('adminId');
      if (adminId && adminId !== 'undefined' && adminId !== '') {
        formData.append('created_by_osws_id', adminId);
      }
      const creatorId = localStorage.getItem('creatorId');
      if (creatorId && creatorId !== 'undefined' && creatorId !== '') {
        formData.append('created_by_org_id', creatorId);
      }

      Swal.fire({
        title: 'Creating Event...',
        text: 'Please wait while we save your event.',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading()
      });

      this.eventService.createEvent(formData).subscribe({
        next: () => {
          Swal.close();
          Swal.fire({ icon: 'success', title: 'Event Created!', text: 'Your event has been created successfully.', confirmButtonColor: '#679436' }).then(() => {
            this.closeCreateModal();
            // refresh lists
            if (this.isOsws) {
              this.fetchOswsEvents();
              this.fetchOrgEvents();
            } else {
              this.fetchEvents();
            }
          });
        },
        error: (error) => {
          console.error('Error creating event:', error);
          Swal.close();
          Swal.fire('Error', 'Failed to create event. Please try again.', 'error');
        }
      });
    }
  }
}
