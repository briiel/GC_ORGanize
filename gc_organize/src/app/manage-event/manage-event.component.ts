import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- Add this import
import { EventService } from '../services/event.service';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-manage-event',
  templateUrl: './manage-event.component.html',
  styleUrls: ['./manage-event.component.css'],
  imports: [CommonModule, FormsModule]
})

export class ManageEventComponent implements OnInit, OnDestroy {
  isSavingInlineEdit = false;
  // Inline edit mode for details panel
  isInlineEditing = false;
  inlineEditEvent: any = null;
  events: any[] = [];
  oswsEvents: any[] = [];
  orgEvents: any[] = [];
  creatorId: number;
  adminId: number;
  searchTerm: string = '';
  // For inline edit poster
  inlineEditPosterFile: File | null = null;
  inlineEditPosterPreviewUrl: string | null = null;

  onInlineEditPosterChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    if (file) {
      this.inlineEditPosterFile = file;
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          this.inlineEditPosterPreviewUrl = e.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    } else {
      this.inlineEditPosterFile = null;
      this.inlineEditPosterPreviewUrl = null;
    }
  }

  removeInlineEditPoster(): void {
    this.inlineEditPosterFile = null;
    this.inlineEditPosterPreviewUrl = null;
    if (this.inlineEditEvent) {
      this.inlineEditEvent.event_poster = '';
    }
  }
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

  // For vertical event list selection
  selectedEvent: any = null;

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

  // Close any open modal when ESC is pressed (matches behavior used in other modals)
  @HostListener('document:keydown.escape', ['$event'])
  onEsc(event: KeyboardEvent) {
    if (this.showParticipantsModal || this.showCreateModal) {
      event.preventDefault();
      if (this.showParticipantsModal) this.closeParticipantsModal();
      if (this.showCreateModal) this.closeCreateModal();
    }
  }

  fetchEvents() {
    this.eventService.getEventsByCreator(this.creatorId).subscribe({
      next: (res) => {
        this.events = res.data || res;
        this.filteredList = this.events;
        // Do not auto-select event; only show details when a title is clicked
        if (this.selectedEvent) {
          // If the selected event was deleted, clear selection
          const stillExists = this.filteredList.some(e => e.event_id === this.selectedEvent.event_id);
          if (!stillExists) this.selectedEvent = null;
        }
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
      next: (response) => {
        console.log('Status updated successfully:', response);
        // Optionally show success message to user
        // You can add a toast notification here
      },
      error: (err) => {
        console.error('Error updating event status:', err);
        // Optionally show error message to user
        // You can add a toast notification here
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
      // If the selected event is filtered out, clear selection
      if (this.selectedEvent && !this.filteredList.some(e => e.event_id === this.selectedEvent.event_id)) {
        this.selectedEvent = null;
      }
    }
  }

  clearSearch() {
    this.searchTerm = '';
    // Optionally, reset other filters if needed
    this.searchEvents();
  }

  filteredEvents() {
    return this.filteredList;
  }

  selectEvent(event: any) {
    this.selectedEvent = event;
    this.isInlineEditing = false;
    this.inlineEditEvent = null;
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

  // Helper to format date as yyyy-MM-dd
  private toDateInputValue(date: any): string {
    if (!date) return '';
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    // Use local time, not UTC, to avoid date shifting
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  editEvent(event: any) {
    // If called from the details panel, enable inline editing
    if (this.selectedEvent && event && this.selectedEvent.event_id === event.event_id) {
      this.isInlineEditing = true;
      // Deep copy to avoid mutating selectedEvent until save
      this.inlineEditEvent = { ...this.selectedEvent };
      // Ensure date fields are in yyyy-MM-dd format for input type="date"
      this.inlineEditEvent.start_date = this.toDateInputValue(this.inlineEditEvent.start_date);
      this.inlineEditEvent.end_date = this.toDateInputValue(this.inlineEditEvent.end_date);
      return;
    }
    // Otherwise, open modal (old logic)
    if (!event || !event.event_id) return;
    this.openEditModal(event.event_id);
  }

  cancelInlineEdit() {
    this.isInlineEditing = false;
    this.inlineEditEvent = null;
  }

  saveInlineEdit() {
    if (!this.inlineEditEvent || !this.inlineEditEvent.event_id) return;
    // Always send dates as yyyy-MM-dd strings
    const formatDate = (d: any) => {
      if (!d) return '';
      if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
      const dateObj = new Date(d);
      if (isNaN(dateObj.getTime())) return '';
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const day = dateObj.getDate().toString().padStart(2, '0');
      return `${dateObj.getFullYear()}-${month}-${day}`;
    };
    let payload: any;
    let isFormData = false;
    const startDateStr = formatDate(this.inlineEditEvent.start_date);
    const endDateStr = formatDate(this.inlineEditEvent.end_date);
    if (this.inlineEditPosterFile) {
      payload = new FormData();
      payload.append('title', this.inlineEditEvent.title);
      payload.append('description', this.inlineEditEvent.description);
      payload.append('location', this.inlineEditEvent.location);
      payload.append('start_date', startDateStr);
      payload.append('start_time', this.inlineEditEvent.start_time);
      payload.append('end_date', endDateStr);
      payload.append('end_time', this.inlineEditEvent.end_time);
      payload.append('status', this.inlineEditEvent.status || '');
      payload.append('event_poster', this.inlineEditPosterFile);
      isFormData = true;
    } else {
      payload = {
        title: this.inlineEditEvent.title,
        description: this.inlineEditEvent.description,
        location: this.inlineEditEvent.location,
        start_date: startDateStr,
        start_time: this.inlineEditEvent.start_time,
        end_date: endDateStr,
        end_time: this.inlineEditEvent.end_time,
        status: this.inlineEditEvent.status || '',
        event_poster: this.inlineEditEvent.event_poster || ''
      };
    }
    Swal.fire({
      title: 'Updating Event...',
      text: 'Please wait while we update your event.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading()
    });
    this.eventService.updateEvent(this.inlineEditEvent.event_id, payload).subscribe({
      next: () => {
        Swal.close();
        // Update selectedEvent and refresh list
        Object.assign(this.selectedEvent, this.inlineEditEvent);
        if (this.inlineEditPosterPreviewUrl) {
          this.selectedEvent.event_poster = this.inlineEditPosterPreviewUrl;
        }
        this.isInlineEditing = false;
        this.inlineEditEvent = null;
        this.inlineEditPosterFile = null;
        this.inlineEditPosterPreviewUrl = null;
        if (this.isOsws) {
          this.fetchOswsEvents();
          this.fetchOrgEvents();
        } else {
          this.fetchEvents();
        }
        Swal.fire('Success', 'Event updated successfully!', 'success');
      },
      error: (error) => {
        Swal.close();
        Swal.fire('Error', 'Failed to update event.', 'error');
      }
    });
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
        // Use toDateInputValue to ensure correct format for date inputs
        this.newEvent = {
          title: event.title || '',
          description: event.description || '',
          location: event.location || '',
          start_date: this.toDateInputValue(event.start_date),
          start_time: event.start_time ? String(event.start_time).substring(0, 5) : '',
          end_date: this.toDateInputValue(event.end_date),
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

  // Build a clean download filename: <studentId>_<event_name>.<ext>
  getProofDownloadName(p: any): string {
    const eventSlug = (this.selectedEventTitle || 'event').toString().trim().replace(/\s+/g, '_').toLowerCase();
    const student = String(p?.student_id ?? 'student');
    let ext = '.webp';
    try {
      const url: string = p?.proof_of_payment || '';
      if (url) {
        const noQuery = url.split('?')[0];
        const m = noQuery.match(/\.([a-zA-Z0-9]+)$/);
        if (m && m[1]) ext = `.${m[1].toLowerCase()}`;
      }
    } catch {}
    return `${student}_${eventSlug}${ext}`;
  }

  // Cloudinary trick: force download with desired filename using fl_attachment
  getProofAttachmentUrl(p: any): string {
    const url: string = p?.proof_of_payment || '';
  if (!url) return '';
  // Only transform Cloudinary delivery URLs
  if (!/https?:\/\/res\.cloudinary\.com\//.test(url)) return url;

  // Build a safe base name without extension for fl_attachment
  const full = this.getProofDownloadName(p).replace(/[^a-zA-Z0-9._-]/g, '_');
  const base = full.replace(/\.[a-zA-Z0-9]+$/, '');

  // Insert fl_attachment immediately after /upload/
  // Keep the rest of the path intact (version, folders, public_id)
  return url.replace('/upload/', `/upload/fl_attachment:${base}/`);
  }

  async downloadProof(p: any): Promise<void> {
    const url: string = p?.proof_of_payment || '';
    if (!url) return;
    const filename = this.getProofDownloadName(p);
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  }

  downloadParticipantsExcel(): void {
    if (!this.participants || this.participants.length === 0) return;

    const worksheetData = this.participants.map((p, i) => ({
      '#': i + 1,
  'Event': this.selectedEventTitle || '-',
      'Student ID': p.student_id ?? '-',
      'First Name': p.first_name ?? '-',
      'Last Name': p.last_name ?? '-',
      'Suffix': p.suffix ?? '-',
      'Department': p.department ?? '-',
      'Program': p.program ?? '-',
      'Proof of Payment URL': p.proof_of_payment ?? '-'
    }));

    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Participants');

    const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    const slug = (this.selectedEventTitle || 'event').toString().trim().replace(/\s+/g, '_').toLowerCase();
    saveAs(blob, `${slug}_participants.xlsx`);
  }
}
