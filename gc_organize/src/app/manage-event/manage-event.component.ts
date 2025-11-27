import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { forkJoin, Subject, Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { CommonModule } from '@angular/common'; // <-- Add this import
import { EventService } from '../services/event.service';
import { EvaluationService } from '../services/evaluation.service';
import { RbacAuthService } from '../services/rbac-auth.service';
import { OsmService, LatLon } from '../services/osm.service';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { ExcelExportService } from '../services/excel-export.service';
import { parseMysqlDatetimeToDate } from '../utils/date-utils';

@Component({
  selector: 'app-manage-event',
  templateUrl: './manage-event.component.html',
  styleUrls: ['./manage-event.component.css'],
  imports: [CommonModule, FormsModule]
})

export class ManageEventComponent implements OnInit, OnDestroy {
  Math = Math; // Expose Math to template
  showMobileModal = false;
  isSavingInlineEdit = false;
  // Inline edit mode for details panel
  isInlineEditing = false;
  inlineEditEvent: any = null;
  events: any[] = [];
  oswsEvents: any[] = [];
  orgEvents: any[] = [];
  creatorId: number;
  adminId: number;
  private _searchTerm: string = '';
  get searchTerm(): string {
    return this._searchTerm;
  }
  set searchTerm(val: string) {
    this._searchTerm = val;
    this.searchEvents();
  }
  // For inline edit poster
  inlineEditPosterFile: File | null = null;
  inlineEditPosterPreviewUrl: string | null = null;

  // Pagination for event list
  eventPage: number = 1;
  eventPageSize: number = 10;
  get eventTotalPages(): number {
    return Math.ceil((this.filteredList?.length || 0) / this.eventPageSize) || 1;
  }
  get pagedEvents(): any[] {
    const sorted = (this.filteredList || []).slice().sort((a, b) => {
      const tA = (a.title || '').toLowerCase();
      const tB = (b.title || '').toLowerCase();
      return tA.localeCompare(tB, undefined, { sensitivity: 'base' });
    });
    const start = (this.eventPage - 1) * this.eventPageSize;
    return sorted.slice(start, start + this.eventPageSize);
  }
  goToEventPage(page: number) {
    if (page < 1 || page > this.eventTotalPages) return;
    this.eventPage = page;
  }
  nextEventPage() {
    if (this.eventPage < this.eventTotalPages) this.eventPage++;
  }
  prevEventPage() {
    if (this.eventPage > 1) this.eventPage--;
  }

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
  // statusFilter removed
  filteredList: any[] = [];
  isOsws: boolean = false;
  orgEventsSearchTerm: string = '';
  filteredOrgEventsList: any[] = [];
  orgEventPage: number = 1;
  orgEventPageSize: number = 10;
  // OSWS sort option for the OSWS events search card
  oswsSortBy: string = 'title_asc';
  orgEventDepartmentFilter: string = ''; // Filter by department
  orgEventStatusFilter: string = 'active'; // Default to show only active events (not yet started + ongoing)
  
  get orgEventTotalPages(): number {
    return Math.ceil((this.filteredOrgEventsList?.length || 0) / this.orgEventPageSize) || 1;
  }
  get pagedOrgEvents(): any[] {
    const sorted = (this.filteredOrgEventsList || []).slice().sort((a, b) => {
      const tA = (a.title || '').toLowerCase();
      const tB = (b.title || '').toLowerCase();
      return tA.localeCompare(tB, undefined, { sensitivity: 'base' });
    });
    const start = (this.orgEventPage - 1) * this.orgEventPageSize;
    return sorted.slice(start, start + this.orgEventPageSize);
  }
  
  // Get unique departments from org events
  get uniqueDepartments(): string[] {
    const departments = this.orgEvents
      .map(event => event.department)
      .filter((dept, index, self) => dept && self.indexOf(dept) === index)
      .sort();
    return departments;
  }
  
  goToOrgEventPage(page: number) {
    if (page < 1 || page > this.orgEventTotalPages) return;
    this.orgEventPage = page;
  }
  nextOrgEventPage() {
    if (this.orgEventPage < this.orgEventTotalPages) this.orgEventPage++;
  }
  prevOrgEventPage() {
    if (this.orgEventPage > 1) this.orgEventPage--;
  }
  
  changeOrgEventPageSize(size: number) {
    this.orgEventPageSize = size;
    this.orgEventPage = 1;
  }

  showParticipantsModal = false;

  participants: any[] = [];
  participantsLoading = false;
  selectedEventTitle = '';
  // Track selections for bulk actions
  selectedRegistrations = new Set<number>();
  // Participants pagination with flexible page size
  participantsPage: number = 1;
  participantsPageSize: number = 10;
  participantsSearchTerm: string = ''; // Search term for filtering participants

  expandedParticipants: Set<number> = new Set(); // Track which participants are expanded
  
  get filteredParticipants(): any[] {
    if (!this.participantsSearchTerm.trim()) {
      return this.participants || [];
    }
    const term = this.participantsSearchTerm.toLowerCase();
    return (this.participants || []).filter(participant => {
      const studentId = (participant.student_id || '').toLowerCase();
      const firstName = (participant.first_name || '').toLowerCase();

      const lastName = (participant.last_name || '').toLowerCase();
      const department = (participant.department || '').toLowerCase();
      const program = (participant.program || '').toLowerCase();
      const fullName = `${firstName} ${lastName}`;
      return studentId.includes(term) || 
             fullName.includes(term) || 
             firstName.includes(term) || 
             lastName.includes(term) ||
             department.includes(term) ||
             program.includes(term);
    });
  }
  
  get participantsTotalPages(): number {
    return Math.ceil((this.filteredParticipants?.length || 0) / this.participantsPageSize) || 1;
  }
  get pagedParticipants(): any[] {
    const start = (this.participantsPage - 1) * this.participantsPageSize;
    return (this.filteredParticipants || []).slice(start, start + this.participantsPageSize);
  }
  goToParticipantsPage(page: number) {
    if (page < 1 || page > this.participantsTotalPages) return;
    this.participantsPage = page;
  }
  nextParticipantsPage() {
    if (this.participantsPage < this.participantsTotalPages) this.participantsPage++;
  }
  prevParticipantsPage() {
    if (this.participantsPage > 1) this.participantsPage--;
  }
  onParticipantsSearchChange() {
    this.participantsPage = 1; // Reset to first page when searching
  }
  changeParticipantsPageSize(size: number) {
    this.participantsPageSize = size;
    this.participantsPage = 1; // Reset to first page
  }

  // Toggle participant expanded state
  toggleParticipantExpanded(index: number) {
    if (this.expandedParticipants.has(index)) {
      this.expandedParticipants.delete(index);
    } else {
      this.expandedParticipants.add(index);
    }
  }

  // Check if participant is expanded
  isParticipantExpanded(index: number): boolean {
    return this.expandedParticipants.has(index);
  }

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
  end_time: '',
  is_paid: false,
  registration_fee: 0
  };

  // Geolocation / place coordinates used for geofence validation
  userCoords: LatLon | null = null; // user's current device location when modal opened
  newEventLat: number | null = null; // event location latitude (resolved via OSM or user's pick)
  newEventLon: number | null = null; // event location longitude
  // Autocomplete suggestions for location input
  locationSuggestions: Array<{ display_name: string; lat: number; lon: number }> = [];
  private locationSearch$ = new Subject<string>();
  private locationSearchSub: Subscription | null = null;
  private statusChangeSub: Subscription | null = null;
  private refreshIntervalId: any = null;

  // Room selection + persistence
  rooms: string[] = [];
  selectedRoom: string = '';
  otherRoomInput: string = '';
  showOtherRoomInput: boolean = false;
  // Whether the chosen location corresponds to Olongapo Gordon College
  isLocationGordon: boolean = false;

  // For vertical event list selection
  selectedEvent: any = null;

  // Evaluations modal state
  showEvaluationsModal = false;
  evaluations: any[] = [];
  evaluationsLoading = false;
  evaluationStats: any = null;
  selectedEventForEvaluation: any = null;
  evaluationsPage: number = 1;
  evaluationsPageSize: number = 10;
  expandedEvaluations: Set<number> = new Set(); // Track which evaluations are expanded
  evaluationSearchTerm: string = ''; // Search term for filtering evaluations
  showAverageRatings: boolean = true; // Toggle for average ratings section
  
  get filteredEvaluations(): any[] {
    if (!this.evaluationSearchTerm.trim()) {
      return this.evaluations || [];
    }
    const term = this.evaluationSearchTerm.toLowerCase();
    return (this.evaluations || []).filter(evaluation => {
      const studentId = (evaluation.student_id || '').toLowerCase();
      const firstName = (evaluation.first_name || '').toLowerCase();
      const lastName = (evaluation.last_name || '').toLowerCase();
      const fullName = `${firstName} ${lastName}`;
      return studentId.includes(term) || fullName.includes(term) || firstName.includes(term) || lastName.includes(term);
    });
  }
  
  get evaluationsTotalPages(): number {
    return Math.ceil((this.filteredEvaluations?.length || 0) / this.evaluationsPageSize) || 1;
  }
  get pagedEvaluations(): any[] {
    const start = (this.evaluationsPage - 1) * this.evaluationsPageSize;
    return (this.filteredEvaluations || []).slice(start, start + this.evaluationsPageSize);
  }
  goToEvaluationsPage(page: number) {
    if (page < 1 || page > this.evaluationsTotalPages) return;
    this.evaluationsPage = page;
  }
  nextEvaluationsPage() {
    if (this.evaluationsPage < this.evaluationsTotalPages) this.evaluationsPage++;
  }
  prevEvaluationsPage() {
    if (this.evaluationsPage > 1) this.evaluationsPage--;
  }
  toggleEvaluationExpanded(index: number) {
    if (this.expandedEvaluations.has(index)) {
      this.expandedEvaluations.delete(index);
    } else {
      this.expandedEvaluations.add(index);
    }
  }
  isEvaluationExpanded(index: number): boolean {
    return this.expandedEvaluations.has(index);
  }
  onEvaluationSearchChange() {
    this.evaluationsPage = 1; // Reset to first page when searching
  }
  changeEvaluationsPageSize(size: number) {
    this.evaluationsPageSize = size;
    this.evaluationsPage = 1; // Reset to first page
  }

  constructor(
    private eventService: EventService, 
    private evaluationService: EvaluationService,
    private router: Router,
    private auth: RbacAuthService,
    private excelExportService: ExcelExportService,
    private osm: OsmService
  ) {
    // Get creator/org ID from JWT
    this.creatorId = this.auth.getCreatorId() || 0;
    this.adminId = this.auth.getAdminId() || 0;
    const primaryRole = this.auth.getPrimaryRole();
    this.isOsws = primaryRole === 'OSWSAdmin';
    // Wire up location autocomplete subject
    this.locationSearchSub = this.locationSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => {
        const s = String(q || '').trim();
        if (!s || s.length < 3) return of([]);
        return this.osm.getPlaceSuggestions(s).pipe(catchError(() => of([])));
      })
    ).subscribe(list => this.locationSuggestions = list || []);
  }

  ngOnInit() {
    if (this.isOsws) {
      this.fetchOswsEvents();
      this.fetchOrgEvents();
      // Subscribe to status change notifications (emitted after manual status updates)
      this.statusChangeSub = this.eventService.statusChanged$.subscribe(() => {
        this.fetchOswsEvents();
        this.fetchOrgEvents();
      });
      // Periodically refresh events so automatic status (computed server-side) is reflected in the UI
      this.refreshIntervalId = setInterval(() => {
        this.fetchOswsEvents();
        this.fetchOrgEvents();
      }, 60000); // 60s
    } else {
      this.fetchEvents();
    }
  }

  ngOnDestroy(): void {
    // Ensure body class is cleared when component is destroyed
    document.body.classList.remove('modal-open');
    if (this.locationSearchSub) {
      this.locationSearchSub.unsubscribe();
      this.locationSearchSub = null;
    }
    if (this.statusChangeSub) {
      this.statusChangeSub.unsubscribe();
      this.statusChangeSub = null;
    }
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
      this.refreshIntervalId = null;
    }
  }

  // Close any open modal when ESC is pressed (matches behavior used in other modals)
  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.showParticipantsModal || this.showCreateModal || this.showMobileModal || this.showEvaluationsModal) {
      if (this.showParticipantsModal) this.closeParticipantsModal();
      if (this.showCreateModal) this.closeCreateModal();
      if (this.showMobileModal) this.closeMobileModal();
      if (this.showEvaluationsModal) this.closeEvaluationsModal();
    }
  }

  fetchEvents() {
    this.eventService.getEventsByCreator(this.creatorId).subscribe({
      next: (res) => {
        this.events = res.data || res;
  // Default view excludes concluded events; they remain searchable
  this.filteredList = (this.events || []).filter(e => (String(e?.status || '').toLowerCase()) !== 'concluded');
  // Reset page within bounds
  this.eventPage = 1;
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
        this.searchOrgEvents(); // Apply initial filters
      },
      error: (err) => {
        console.error('Error fetching org events:', err);
      }
    });
  }

  updateEventStatus(event: any) {
    this.eventService.updateEventStatus(event.event_id, event.status).subscribe({
      next: (response) => {
        
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

  // Determine if a given desired status option should be enabled for manual change (OSWS table)
  isStatusOptionEnabled(event: any, desired: string): boolean {
    const desiredLower = String(desired || '').toLowerCase();
    const current = String(event?.status || '').toLowerCase();
    if (desiredLower === current) return false; // don't enable selecting the same value
    if (desiredLower === 'cancelled') return true; // always allow manual cancel
    const auto = String(event?.auto_status || '').toLowerCase();
    const mismatch = !!event?.auto_mismatch;
    // Allow only when auto computed exists, current != auto, and desired equals auto (sync fix)
    return !!auto && mismatch && desiredLower === auto;
  }

  statusOptionTooltip(event: any, desired: string): string {
    const desiredLower = String(desired || '').toLowerCase();
    const current = String(event?.status || '').toLowerCase();
    if (desiredLower === current) return 'Already set';
    if (desiredLower === 'cancelled') return 'Cancel this event';
    const auto = String(event?.auto_status || '').toLowerCase();
    const mismatch = !!event?.auto_mismatch;
    if (!!auto && mismatch && desiredLower === auto) return 'Sync to automatic status';
    return 'Manual change not allowed unless syncing to automatic status';
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
    // For OSWS, search both tables (not handled here)
    if (this.isOsws) {
      // Optionally implement search for both tables if needed
    } else {
      const search = this.searchTerm.trim().toLowerCase();
      if (!search) {
  // No search: hide concluded
  this.filteredList = (this.events || []).filter(e => (String(e?.status || '').toLowerCase()) !== 'concluded');
      } else {
        // With search: include concluded results if they match title or status
        this.filteredList = (this.events || []).filter(event => {
          const title = String(event?.title || '').toLowerCase();
          const status = String(event?.status || '').toLowerCase();
          return title.includes(search) || status.includes(search);
        });
      }
      // If the selected event is filtered out, clear selection
      if (this.selectedEvent && !this.filteredList.some(e => e.event_id === this.selectedEvent.event_id)) {
        this.selectedEvent = null;
      }
  // Reset to first page for new results
  this.eventPage = 1;
    }
  }

  // clearSearch removed as requested

  filteredEvents() {
    return this.filteredList;
  }

  selectEvent(event: any) {
    this.selectedEvent = event;
    this.isInlineEditing = false;
    this.inlineEditEvent = null;
    // Open modal on mobile
    if (window.innerWidth < 768) {
      this.showMobileModal = true;
      this.toggleBodyModalClass();
    }
  }

  closeMobileModal() {
    this.showMobileModal = false;
    this.toggleBodyModalClass();
  }

  searchOrgEvents() {
    let results = this.orgEvents;
    
    // Apply status filter
    if (this.orgEventStatusFilter === 'active') {
      // Show only 'not yet started' and 'ongoing' events
      results = results.filter(event => 
        event.status === 'not yet started' || event.status === 'ongoing'
      );
    } else if (this.orgEventStatusFilter === 'all') {
      // Show all events (no status filter)
      results = results;
    } else if (this.orgEventStatusFilter) {
      // Filter by specific status
      results = results.filter(event => event.status === this.orgEventStatusFilter);
    }
    
    // Apply department filter
    if (this.orgEventDepartmentFilter) {
      results = results.filter(event => event.department === this.orgEventDepartmentFilter);
    }
    
    // Apply search term filter
    const term = this.orgEventsSearchTerm.trim().toLowerCase();
    if (term) {
      results = results.filter(event =>
        (event.title && event.title.toLowerCase().includes(term)) ||
        ((event.room && event.room.toLowerCase().includes(term)) || (event.location && event.location.toLowerCase().includes(term))) ||
        (event.department && event.department.toLowerCase().includes(term)) ||
        (event.start_date && parseMysqlDatetimeToDate(event.start_date)?.toLocaleDateString().toLowerCase().includes(term)) ||
        (event.end_date && parseMysqlDatetimeToDate(event.end_date)?.toLocaleDateString().toLowerCase().includes(term)) ||
        (event.status && event.status.toLowerCase().includes(term))
      );
    }
    
    this.filteredOrgEventsList = results;
    this.orgEventPage = 1;
  }

  clearOrgEventsSearch() {
    this.orgEventsSearchTerm = '';
    this.orgEventDepartmentFilter = '';
    this.orgEventStatusFilter = 'active'; // Reset to default
    this.searchOrgEvents(); // Re-apply filters
  }
  
  onOrgEventDepartmentChange() {
    this.orgEventPage = 1;
    this.searchOrgEvents();
  }
  
  onOrgEventStatusChange() {
    this.orgEventPage = 1;
    this.searchOrgEvents();
  }

  filteredOrgEvents() {
  return this.filteredOrgEventsList || [];
  }

  filteredOswsEvents(): any[] {
    if (!this.searchTerm) return this.oswsEvents;
    const term = this.searchTerm.toLowerCase();
    const filtered = this.oswsEvents.filter(event =>
      (event.title && event.title.toLowerCase().includes(term)) ||
      ((event.room && event.room.toLowerCase().includes(term)) || (event.location && event.location.toLowerCase().includes(term))) ||
      (event.start_date && event.start_date.toLowerCase().includes(term)) ||
      (event.end_date && event.end_date.toLowerCase().includes(term))
    );

    // Apply sorting based on oswsSortBy
    const sorted = filtered.slice();
    switch (this.oswsSortBy) {
      case 'title_asc':
        sorted.sort((a, b) => (a.title || '').toLowerCase().localeCompare((b.title || '').toLowerCase()));
        break;
      case 'title_desc':
        sorted.sort((a, b) => (b.title || '').toLowerCase().localeCompare((a.title || '').toLowerCase()));
        break;
      case 'date_asc':
        sorted.sort((a, b) => (parseMysqlDatetimeToDate(a.start_date)?.getTime() ?? 0) - (parseMysqlDatetimeToDate(b.start_date)?.getTime() ?? 0));
        break;
      case 'date_desc':
        sorted.sort((a, b) => (parseMysqlDatetimeToDate(b.start_date)?.getTime() ?? 0) - (parseMysqlDatetimeToDate(a.start_date)?.getTime() ?? 0));
        break;
      default:
        break;
    }

    return sorted;
  }

  // Called from the Search & Sort card 'Apply' button — kept lightweight for now
  applyOswsFilters(): void {
    // The template bindings for `searchTerm` and `oswsSortBy` update the filtered view automatically.
    // This method exists for explicit UX (Apply button) and future expansion.
    return;
  }

  confirmDeleteEvent(event: any) {
    Swal.fire({
      title: 'Are you sure?',
      text: `Move event "${event.title}" to archive?`,
      icon: 'warning',
      showCancelButton: true,
  confirmButtonText: 'Archive',
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
  this.participantsPage = 1;
  this.toggleBodyModalClass();
    this.eventService.getEventParticipants(event.event_id).subscribe({
      next: (res) => {
        this.participants = res.data || res;
        this.participantsLoading = false;
  this.selectedRegistrations.clear();
    // Ensure current page is within bounds after load
    const total = this.participantsTotalPages;
    if (this.participantsPage > total) this.participantsPage = total;
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
  this.participantsPage = 1;
    this.participantsSearchTerm = ''; // Clear search term
    this.expandedParticipants.clear(); // Clear expanded participants
    this.selectedRegistrations.clear();
  this.toggleBodyModalClass();
  }

  private refreshParticipantsList(): void {
    if (!this.selectedEvent) return;
    const id = this.selectedEvent.event_id;
    if (!id) return;
    this.participantsLoading = true;
    this.eventService.getEventParticipants(id).subscribe({
      next: (res) => {
        this.participants = res.data || res;
        this.participantsLoading = false;
        this.selectedRegistrations.clear();
        const total = this.participantsTotalPages;
        if (this.participantsPage > total) this.participantsPage = total;
      },
      error: () => {
        this.participantsLoading = false;
      }
    });
  }

  approveParticipant(p: any) {
    if (!p?.registration_id) return;
    this.eventService.approveRegistration(p.registration_id).subscribe({
      next: () => {
        Swal.fire('Approved', 'Registration approved.', 'success');
        this.refreshParticipantsList();
      },
      error: (err) => {
        console.error('Approve failed', err);
        Swal.fire('Error', 'Failed to approve registration.', 'error');
      }
    });
  }

  rejectParticipant(p: any) {
    if (!p?.registration_id) return;
    this.eventService.rejectRegistration(p.registration_id).subscribe({
      next: () => {
        Swal.fire('Declined', 'Registration declined.', 'success');
        this.refreshParticipantsList();
      },
      error: (err) => {
        console.error('Decline failed', err);
        Swal.fire('Error', 'Failed to decline registration.', 'error');
      }
    });
  }

  // Selection helpers
  isSelected(p: any): boolean {
    if (!p?.registration_id) return false;
    const status = String(p?.status || '').toLowerCase();
    if (status !== 'pending') return false;
    return this.selectedRegistrations.has(Number(p.registration_id));
  }
  toggleSelection(p: any): void {
    if (!p?.registration_id) return;
    const status = String(p?.status || '').toLowerCase();
    if (status !== 'pending') return;
    const id = Number(p.registration_id);
    if (this.selectedRegistrations.has(id)) this.selectedRegistrations.delete(id);
    else this.selectedRegistrations.add(id);
  }
  toggleSelectAllPage(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const pageItems = this.pagedParticipants;
    const pendingItems = pageItems.filter(p => String(p?.status || '').toLowerCase() === 'pending');
    if (input.checked) {
      pendingItems.forEach(p => { if (p?.registration_id) this.selectedRegistrations.add(Number(p.registration_id)); });
    } else {
      pendingItems.forEach(p => { if (p?.registration_id) this.selectedRegistrations.delete(Number(p.registration_id)); });
    }
  }
  get hasSelection(): boolean { return this.selectedRegistrations.size > 0; }
  get selectedCount(): number { return this.selectedRegistrations.size; }

  // Page-level helpers for template
  hasPendingOnPage(): boolean {
    return this.pagedParticipants.some(p => String(p?.status || '').toLowerCase() === 'pending');
  }
  isAllPendingSelectedOnPage(): boolean {
    const pendings = this.pagedParticipants.filter(p => String(p?.status || '').toLowerCase() === 'pending');
    return pendings.length > 0 && pendings.every(p => this.isSelected(p));
  }

  // Status helpers for template
  isPending(p: any): boolean {
    return String(p?.status || '').toLowerCase() === 'pending';
  }
  isApproved(p: any): boolean {
    return String(p?.status || '').toLowerCase() === 'approved';
  }
  isRejected(p: any): boolean {
    return String(p?.status || '').toLowerCase() === 'rejected';
  }

  bulkApproveSelected(): void {
    if (!this.hasSelection) return;
    const calls = Array.from(this.selectedRegistrations).map(id => this.eventService.approveRegistration(id));
    forkJoin(calls).subscribe({
      next: () => {
        Swal.fire('Approved', 'Selected registrations approved.', 'success');
        this.refreshParticipantsList();
      },
      error: (err) => {
        console.error('Bulk approve failed', err);
        Swal.fire('Error', 'Some approvals failed. Please try again.', 'error');
        this.refreshParticipantsList();
      }
    });
  }

  bulkRejectSelected(): void {
    if (!this.hasSelection) return;
    const calls = Array.from(this.selectedRegistrations).map(id => this.eventService.rejectRegistration(id));
    forkJoin(calls).subscribe({
      next: () => {
        Swal.fire('Declined', 'Selected registrations declined.', 'success');
        this.refreshParticipantsList();
      },
      error: (err) => {
        console.error('Bulk decline failed', err);
        Swal.fire('Error', 'Some declines failed. Please try again.', 'error');
        this.refreshParticipantsList();
      }
    });
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

  // Helper to check if an event is concluded
  isEventConcluded(event: any): boolean {
    if (!event) return false;
    const status = String(event.status || '').toLowerCase();
    return status === 'concluded';
  }

  // Helper to check if an event can be cancelled
  canCancelEvent(event: any): boolean {
    if (!event) return false;
    const status = String(event.status || '').toLowerCase();
    // Can only cancel if status is not already 'cancelled' or 'concluded'
    return status !== 'cancelled' && status !== 'concluded';
  }

  // Confirm before cancelling an event
  confirmCancelEvent(event: any): void {
    Swal.fire({
      title: 'Cancel Event?',
      text: 'Are you sure you want to cancel this event? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, cancel event',
      cancelButtonText: 'No, keep event'
    }).then((result) => {
      if (result.isConfirmed) {
        this.cancelEvent(event);
      }
    });
  }

  // Cancel an event by updating its status to 'cancelled'
  cancelEvent(event: any): void {
    this.eventService.updateEventStatus(event.event_id, 'cancelled').subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: 'Event Cancelled',
          text: 'The event has been cancelled successfully.',
          confirmButtonColor: this.isOsws ? '#14532d' : '#679436'
        });

        // Update the event status in the local data
        event.status = 'cancelled';
        if (this.selectedEvent && this.selectedEvent.event_id === event.event_id) {
          this.selectedEvent.status = 'cancelled';
        }

        // Reload events to reflect changes
        this.fetchEvents();
      },
      error: (error) => {
        console.error('Error cancelling event:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'Failed to cancel event. Please try again.',
          confirmButtonColor: '#dc2626'
        });
      }
    });
  }

  editEvent(event: any) {
    // Prevent editing concluded events
    if (this.isEventConcluded(event)) {
      Swal.fire({
        icon: 'info',
        title: 'Cannot Edit',
        text: 'This event has concluded and cannot be edited.',
        confirmButtonColor: this.isOsws ? '#14532d' : '#679436'
      });
      return;
    }
    
    // If called from the details panel, enable inline editing
    if (this.selectedEvent && event && this.selectedEvent.event_id === event.event_id) {
      this.isInlineEditing = true;
      // Deep copy to avoid mutating selectedEvent until save
  this.inlineEditEvent = { ...this.selectedEvent };
      // Ensure date fields are in yyyy-MM-dd format for input type="date"
      this.inlineEditEvent.start_date = this.toDateInputValue(this.inlineEditEvent.start_date);
      this.inlineEditEvent.end_date = this.toDateInputValue(this.inlineEditEvent.end_date);
  // Coerce is_paid to boolean for radio binding
  this.inlineEditEvent.is_paid = !!this.inlineEditEvent.is_paid;
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
    // Determine room to send for inline edits (use inlineEditEvent.room if present,
    // otherwise use selectedRoom / otherRoomInput similar to create flow)
    let roomToSend = '';
    if (this.inlineEditEvent && this.inlineEditEvent.room) {
      roomToSend = String(this.inlineEditEvent.room || '').trim();
    } else if (this.showOtherRoomInput && this.otherRoomInput && this.otherRoomInput.trim()) {
      roomToSend = this.otherRoomInput.trim();
      this.saveCustomRoomToStorage(roomToSend);
    } else if (this.selectedRoom) {
      roomToSend = String(this.selectedRoom || '').trim();
    }

    // Determine coordinates from inline event or modal-scoped newEventLat/newEventLon
    const inlineLat = this.inlineEditEvent && (this.inlineEditEvent.event_latitude != null) ? Number(this.inlineEditEvent.event_latitude) : null;
    const inlineLon = this.inlineEditEvent && (this.inlineEditEvent.event_longitude != null) ? Number(this.inlineEditEvent.event_longitude) : null;
    const latToSend = inlineLat != null ? inlineLat : (this.newEventLat != null ? this.newEventLat : null);
    const lonToSend = inlineLon != null ? inlineLon : (this.newEventLon != null ? this.newEventLon : null);

    if (this.inlineEditPosterFile) {
      payload = new FormData();
      payload.append('title', this.inlineEditEvent.title);
      payload.append('description', this.inlineEditEvent.description);
      payload.append('location', this.inlineEditEvent.location);
      payload.append('start_date', startDateStr);
      payload.append('start_time', this.inlineEditEvent.start_time);
      payload.append('end_date', endDateStr);
      payload.append('end_time', this.inlineEditEvent.end_time);
      payload.append('is_paid', this.inlineEditEvent.is_paid ? '1' : '0');
      payload.append('registration_fee', this.inlineEditEvent.is_paid ? String(Number(this.inlineEditEvent.registration_fee || 0).toFixed(2)) : '0');
      payload.append('event_poster', this.inlineEditPosterFile);
      // Append room and coords when available
      // Only include room if location is on-campus
      if (this.isLocationGordon && roomToSend) payload.append('room', roomToSend);
      if (latToSend != null && lonToSend != null) {
        payload.append('event_latitude', String(latToSend));
        payload.append('event_longitude', String(lonToSend));
      }
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
        is_paid: this.inlineEditEvent.is_paid ? 1 : 0,
        registration_fee: this.inlineEditEvent.is_paid ? Number(this.inlineEditEvent.registration_fee || 0).toFixed(2) : 0,
        event_poster: this.inlineEditEvent.event_poster || ''
      } as any;
      if (this.isLocationGordon && roomToSend) (payload as any).room = roomToSend;
      if (latToSend != null && lonToSend != null) {
        (payload as any).event_latitude = latToSend;
        (payload as any).event_longitude = lonToSend;
      }
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
    this.newEvent = { title: '', description: '', location: '', start_date: '', start_time: '', end_date: '', end_time: '', is_paid: false, registration_fee: 0 };
    this.isImageUploaded = false;
    this.eventPosterFile = null;
    this.posterPreviewUrl = null;
    this.isEditing = false;
    this.editingEventId = null;
    this.newEventLat = null;
    this.newEventLon = null;
    this.otherRoomInput = '';
    this.showOtherRoomInput = false;

    // load saved rooms (defaults + persisted)
    this.loadSavedRooms();

    // clear any preview elements if present in DOM (best-effort)
    const previewContainer = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img') as HTMLImageElement | null;
    if (previewContainer) previewContainer.classList.add('hidden');
    if (previewImg) previewImg.src = '';
    const fileInput = document.getElementById('dropzone-file') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';

    // Attempt to get user's current location (permission prompt)
    if (navigator && 'geolocation' in navigator) {
      try {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            this.userCoords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          },
          (err) => {
            // ignore silently; user may decline
            this.userCoords = null;
          },
          { enableHighAccuracy: true, maximumAge: 5 * 60 * 1000, timeout: 8000 }
        );
      } catch (e) {
        this.userCoords = null;
      }
    }

    this.showCreateModal = true;
    this.isLocationGordon = false;
    this.toggleBodyModalClass();
  }

  closeCreateModal() {
    this.showCreateModal = false;
  this.toggleBodyModalClass();
  }

  // Load saved rooms from localStorage and merge with defaults
  private loadSavedRooms(): void {
    const defaults = ['Function Hall', 'PE Room'];
    try {
      const raw = localStorage.getItem('gc_rooms');
      const saved = raw ? JSON.parse(raw) : [];
      // Merge while preserving defaults first
      const merged = Array.from(new Set([...defaults, ...(Array.isArray(saved) ? saved : [])]));
      this.rooms = merged;
      this.selectedRoom = this.rooms.length ? this.rooms[0] : '';
      this.showOtherRoomInput = this.selectedRoom === 'Others';
    } catch (e) {
      this.rooms = defaults;
      this.selectedRoom = this.rooms[0];
      this.showOtherRoomInput = false;
    }
  }

  // If the active location is on-campus, ensure a sensible default room is selected
  private ensureRoomForLocation(): void {
    if (this.isLocationGordon) {
      // If no room chosen, pick the first available room (not 'Others')
      if (!this.selectedRoom || this.selectedRoom === '') {
        const first = this.rooms.find(r => r && r !== 'Others');
        if (first) this.selectedRoom = first;
      }
    } else {
      // Off-campus: clear room selections
      this.selectedRoom = '';
      this.showOtherRoomInput = false;
      this.otherRoomInput = '';
    }
  }

  // Called when location input changes; push into search subject for suggestions
  onLocationChange(value: string) {
    const raw = String(value || '');
    // Clear any previously selected coordinates when user edits the field
    this.newEventLat = null;
    this.newEventLon = null;
    // Update whether location is at Gordon College (simple string check)
    this.isLocationGordon = this.isGordonLocation(raw);
    this.locationSearch$.next(raw);
    // Update room availability right away for typed locations
    this.ensureRoomForLocation();
  }

  // Inline edit: when the location input changes in the details panel
  onInlineLocationChange(value: string) {
    try {
      // clear any previously resolved inline coordinates when user edits the field
      if (this.inlineEditEvent) {
        this.inlineEditEvent.event_latitude = null;
        this.inlineEditEvent.event_longitude = null;
      }
      // Update whether location is at Gordon College for room logic
      this.isLocationGordon = this.isGordonLocation(String(value || ''));
    } catch (e) {
      // ignore
    }
  }

  // Use device geolocation to fill inline edit location and reverse-lookup address
  useCurrentLocationForInline(): void {
    if (!this.inlineEditEvent) return;
    if (navigator && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          // reverse lookup to get a human-readable address
          this.osm.reverseLookup(lat, lon).subscribe(address => {
            if (address) {
              this.inlineEditEvent.location = address;
              this.inlineEditEvent.event_latitude = Number(lat);
              this.inlineEditEvent.event_longitude = Number(lon);
              this.isLocationGordon = this.isGordonLocation(address);
            } else {
              // fallback: write coordinates as location string
              this.inlineEditEvent.location = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
              this.inlineEditEvent.event_latitude = Number(lat);
              this.inlineEditEvent.event_longitude = Number(lon);
              this.isLocationGordon = this.isGordonLocation(this.inlineEditEvent.location);
            }
          }, () => {
            this.inlineEditEvent.location = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
            this.inlineEditEvent.event_latitude = Number(lat);
            this.inlineEditEvent.event_longitude = Number(lon);
            this.isLocationGordon = this.isGordonLocation(this.inlineEditEvent.location);
          });
        },
        (err) => {
          console.warn('Geolocation failed:', err);
          Swal.fire('Error', 'Unable to get current location. Please allow location access or enter address manually.', 'error');
        },
        { enableHighAccuracy: true, maximumAge: 5 * 60 * 1000, timeout: 8000 }
      );
    } else {
      Swal.fire('Not Supported', 'Geolocation is not available in your browser.', 'info');
    }
  }

  clearInlineLocation(): void {
    if (!this.inlineEditEvent) return;
    this.inlineEditEvent.location = '';
    this.inlineEditEvent.event_latitude = null;
    this.inlineEditEvent.event_longitude = null;
    // reset room availability for typed locations
    this.isLocationGordon = false;
  }

  // Called when user selects a suggested place
  selectLocationSuggestion(s: { display_name: string; lat: number; lon: number }) {
    if (!s) return;
    this.newEvent.location = s.display_name;
    this.newEventLat = Number(s.lat);
    this.newEventLon = Number(s.lon);
    // Determine if the selected suggestion refers to Gordon College
    this.isLocationGordon = this.isGordonLocation(s.display_name);
    this.locationSuggestions = [];
    this.ensureRoomForLocation();
  }

  // Use device's current location as event location (reverse-lookup address if available)
  useCurrentLocation(): void {
    if (!this.userCoords) {
      // Try to request again
      if (navigator && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition((pos) => {
          this.userCoords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          this.newEventLat = this.userCoords.lat;
          this.newEventLon = this.userCoords.lon;
          this.osm.reverseLookup(this.userCoords.lat, this.userCoords.lon).subscribe(address => {
            if (address) {
              this.newEvent.location = address;
              this.isLocationGordon = this.isGordonLocation(address);
            }
          });
        }, () => {}, { enableHighAccuracy: true });
      }
      return;
    }
    this.newEventLat = this.userCoords.lat;
    this.newEventLon = this.userCoords.lon;
    this.osm.reverseLookup(this.userCoords.lat, this.userCoords.lon).subscribe(address => {
      if (address) {
        this.newEvent.location = address;
        this.isLocationGordon = this.isGordonLocation(address);
        this.ensureRoomForLocation();
        this.ensureRoomForLocation();
      }
    });
  }

  // Simple heuristic: check if a place/address string refers to Gordon College
  private isGordonLocation(place: string | null | undefined): boolean {
    if (!place) return false;
    const s = String(place).toLowerCase();
    const keywords = ['gordon college', 'olongapo gordon', 'gordon'];
    return keywords.some(k => s.includes(k));
  }

  onRoomSelect(room: string) {
    this.selectedRoom = room;
    this.showOtherRoomInput = room === 'Others';
    if (!this.showOtherRoomInput) this.otherRoomInput = '';
  }

  private saveCustomRoomToStorage(roomName: string) {
    if (!roomName) return;
    try {
      const raw = localStorage.getItem('gc_rooms');
      const saved = raw ? JSON.parse(raw) : [];
      const arr = Array.isArray(saved) ? saved : [];
      if (!arr.includes(roomName)) arr.push(roomName);
      localStorage.setItem('gc_rooms', JSON.stringify(arr));
      // update in-memory list
      this.rooms = Array.from(new Set([...this.rooms.filter(r => r !== 'Others'), ...arr]));
    } catch (e) {
      // ignore
    }
  }

  // Public handler to save a custom room entered in the modal
  saveCustomRoom(): void {
    const roomName = (this.otherRoomInput || '').trim();
    if (!roomName) {
      Swal.fire({ icon: 'error', title: 'Invalid Room', text: 'Please enter a room name or number before saving.', confirmButtonColor: '#d33' });
      return;
    }
    try {
      this.saveCustomRoomToStorage(roomName);
      this.selectedRoom = roomName;
      this.showOtherRoomInput = false;
      this.otherRoomInput = '';
    } catch (e) {
      console.error('Failed to save custom room', e);
      Swal.fire('Error', 'Failed to save custom room. Please try again.', 'error');
    }
  }

  openCustomRoomInput(): void {
    this.showOtherRoomInput = true;
    // small delay to allow input to render, then focus
    setTimeout(() => {
      try {
        const el = document.querySelector<HTMLInputElement>('#other-room-input');
        if (el) el.focus();
      } catch (e) {}
    }, 50);
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
          end_time: event.end_time ? String(event.end_time).substring(0, 5) : '',
          is_paid: !!event.is_paid,
          registration_fee: Number(event.registration_fee ?? 0)
        };
        // Load room if present
        try {
          this.loadSavedRooms();
          if (event.room) {
            if (this.rooms.includes(event.room)) {
              this.selectedRoom = event.room;
              this.showOtherRoomInput = false;
              this.otherRoomInput = '';
            } else {
              this.selectedRoom = 'Others';
              this.showOtherRoomInput = true;
              this.otherRoomInput = event.room;
            }
          }
        } catch (e) {}

        // Determine if loaded event location is Gordon College
        this.isLocationGordon = this.isGordonLocation(event.location || this.newEvent.location || '');

        // Load existing coordinates if backend provided them
        if (event.event_latitude != null && event.event_longitude != null) {
          this.newEventLat = Number(event.event_latitude);
          this.newEventLon = Number(event.event_longitude);
        }
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
  formData.append('is_paid', this.newEvent.is_paid ? '1' : '0');
    // If paid, validate fee
    if (this.newEvent.is_paid) {
      const fee = Number(this.newEvent.registration_fee);
      if (isNaN(fee) || fee < 0) {
        Swal.fire({ icon: 'error', title: 'Invalid Fee', text: 'Please enter a valid registration fee (0 or higher).', confirmButtonColor: '#d33' });
        return;
      }
      formData.append('registration_fee', String(fee.toFixed(2)));
    } else {
      formData.append('registration_fee', '0');
    }
    if (this.eventPosterFile) {
      formData.append('event_poster', this.eventPosterFile);
    }

      // Append room info (selected or other) and persist custom rooms
    let roomToSend = '';
    if (this.showOtherRoomInput && this.otherRoomInput && this.otherRoomInput.trim()) {
      roomToSend = this.otherRoomInput.trim();
      // persist custom room for next time
      this.saveCustomRoomToStorage(roomToSend);
    } else if (this.selectedRoom) {
      roomToSend = this.selectedRoom;
    }
    // Only append room for on-campus locations
    if (this.isLocationGordon && roomToSend) formData.append('room', roomToSend);

    // Append event coordinates for geofence validation (if resolved)
    if (this.newEventLat != null && this.newEventLon != null) {
      formData.append('event_latitude', String(this.newEventLat));
      formData.append('event_longitude', String(this.newEventLon));
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
      const adminId = this.auth.getAdminId();
      if (adminId) {
        formData.append('created_by_osws_id', String(adminId));
      }
      const creatorId = this.auth.getCreatorId();
      if (creatorId) {
        formData.append('created_by_org_id', String(creatorId));
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

  async downloadParticipantsExcel(): Promise<void> {
    if (!this.participants || this.participants.length === 0) return;

    const headers = ['#', 'Event', 'Student ID', 'First Name', 'Last Name', 'Suffix', 'Department', 'Program', 'Proof of Payment URL'];
    
    const data = this.participants.map((p, i) => [
      i + 1,
      this.selectedEventTitle || '-',
      p.student_id ?? '-',
      p.first_name ?? '-',
      p.last_name ?? '-',
      p.suffix ?? '-',
      p.department ?? '-',
      p.program ?? '-',
      p.proof_of_payment ?? '-'
    ]);

    const slug = (this.selectedEventTitle || 'event').toString().trim().replace(/\s+/g, '_').toLowerCase();
    const filename = `${slug}_participants.xlsx`;

    await this.excelExportService.createAndExportExcel('Participants', headers, data, filename);
  }

  // ============ EVALUATION METHODS ============

  openEvaluationsModal(event: any): void {
    this.selectedEventForEvaluation = event;
    this.evaluations = [];
    this.evaluationStats = null;
    this.evaluationsPage = 1;
    this.evaluationsLoading = true;
    this.showEvaluationsModal = true;
    document.body.classList.add('modal-open');

    this.evaluationService.getEventEvaluations(event.event_id).subscribe({
      next: (response) => {
        this.evaluationsLoading = false;

        // Support multiple response shapes: { success, data: { evaluations, stats } } OR { evaluations, stats } OR Array
        let data: any = null;
        if (response && response.data) data = response.data;
        else data = response;

        if (Array.isArray(response)) {
          // Backend might return an array directly
          this.evaluations = response;
          this.evaluationStats = { total_evaluations: response.length, unique_participants: response.length };
        } else {
          this.evaluations = data && data.evaluations ? data.evaluations : (data && Array.isArray(data) ? data : []);
          this.evaluationStats = data && data.stats ? data.stats : { total_evaluations: this.evaluations.length, unique_participants: this.evaluations.length };
        }
      },
      error: (error) => {
        console.error('Error fetching evaluations:', error);
        this.evaluationsLoading = false;
        Swal.fire('Error', 'Failed to load evaluations. ' + (error.error?.message || ''), 'error');
      }
    });
  }

  closeEvaluationsModal(): void {
    this.showEvaluationsModal = false;
    this.selectedEventForEvaluation = null;
    this.evaluations = [];
    this.evaluationStats = null;
    this.evaluationsPage = 1;
    this.evaluationSearchTerm = '';
    this.expandedEvaluations.clear();
    document.body.classList.remove('modal-open');
  }

  // Calculate average rating for a specific question
  getAverageRating(questionKey: string): number {
    if (!this.evaluations || this.evaluations.length === 0) return 0;
    
    let sum = 0;
    let count = 0;
    
    this.evaluations.forEach(evaluation => {
      const responses = evaluation.responses;
      if (responses && responses.ratings && responses.ratings[questionKey]) {
        const value = responses.ratings[questionKey];
        if (value !== 'NA' && !isNaN(Number(value))) {
          sum += Number(value);
          count++;
        }
      }
    });
    
    return count > 0 ? sum / count : 0;
  }

  // Get rating label
  getRatingLabel(rating: number): string {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 3.5) return 'Very Good';
    if (rating >= 2.5) return 'Good';
    if (rating >= 1.5) return 'Fair';
    return 'Needs Improvement';
  }

  // Get individual evaluation average rating
  getIndividualAverageRating(evaluation: any): number {
    const responses = evaluation?.responses;
    if (!responses || !responses.ratings) return 0;
    
    const ratings = responses.ratings;
    const ratingQuestions = ['question1', 'question2', 'question3', 'question4', 'question5', 
                             'question6', 'question7', 'question8', 'question9', 'question10', 
                             'question11', 'question12', 'question13'];
    
    let sum = 0;
    let count = 0;
    
    ratingQuestions.forEach(q => {
      const value = ratings[q];
      // Only count numeric values (skip 'NA' and null/undefined)
      if (value && value !== 'NA' && !isNaN(Number(value))) {
        sum += Number(value);
        count++;
      }
    });
    
    return count > 0 ? sum / count : 0;
  }

  // Get rating color class
  getRatingColorClass(rating: number): string {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-blue-600';
    if (rating >= 2.5) return 'text-yellow-600';
    if (rating >= 1.5) return 'text-orange-600';
    return 'text-red-600';
  }

  // Download evaluations as Excel
  async downloadEvaluationsExcel(): Promise<void> {
    if (!this.evaluations || this.evaluations.length === 0) return;

    const headers = [
      '#', 'Event', 'Student ID', 'Student Name', 'Department', 'Program', 'Submitted At',
      'Q1: Venue', 'Q2: Time Management', 'Q3: Facilitator Knowledge', 'Q4: Topic Relevance',
      'Q5: Learning Materials', 'Q6: Activities', 'Q7: Engagement', 'Q8: Objectives Met',
      'Q9: Overall Satisfaction', 'Q10: Organization', 'Q11: Support Staff', 'Q12: Registration Process',
      'Q13: Would Recommend', 'Most Helpful Aspects', 'Suggestions for Improvement', 'Additional Comments'
    ];

    const data = this.evaluations.map((evaluation, i) => {
      const responses = evaluation.responses || {};
      const ratings = responses.ratings || {};
      const comments = responses.comments || {};
      
      return [
        i + 1,
        this.selectedEventForEvaluation?.title || '-',
        evaluation.student_id ?? '-',
        `${evaluation.first_name || ''} ${evaluation.middle_initial || ''} ${evaluation.last_name || ''} ${evaluation.suffix || ''}`.trim(),
        evaluation.department ?? '-',
        evaluation.program ?? '-',
        evaluation.submitted_at ? (parseMysqlDatetimeToDate(evaluation.submitted_at)?.toLocaleString() ?? '-') : '-',
        ratings.question1 ?? '-',
        ratings.question2 ?? '-',
        ratings.question3 ?? '-',
        ratings.question4 ?? '-',
        ratings.question5 ?? '-',
        ratings.question6 ?? '-',
        ratings.question7 ?? '-',
        ratings.question8 ?? '-',
        ratings.question9 ?? '-',
        ratings.question10 ?? '-',
        ratings.question11 ?? '-',
        ratings.question12 ?? '-',
        ratings.question13 ?? '-',
        comments.question14 ?? '-',
        comments.question15 ?? '-',
        comments.question16 ?? '-'
      ];
    });

    const slug = (this.selectedEventForEvaluation?.title || 'event').toString().trim().replace(/\s+/g, '_').toLowerCase();
    const filename = `${slug}_evaluations.xlsx`;

    await this.excelExportService.createAndExportExcel('Evaluations', headers, data, filename);
  }

  // Get question labels for display
  getQuestionLabel(questionKey: string): string {
    const labels: { [key: string]: string } = {
      'question1': 'The title or theme aligns with the goals of the activity',
      'question2': 'The goals were aligned with the College\'s vision and mission',
      'question3': 'The activity supported the overall development of the students',
      'question4': 'The objectives met the students\' needs and advanced the aims of the relevant organizations',
      'question5': 'The location of the activity was suitable for its execution',
      'question6': 'The activity was conducted as planned',
      'question7': 'The quality of food and the service provided were satisfactory',
      'question8': 'The activity was carried out successfully from beginning to end',
      'question9': 'Participants demonstrated good behavior throughout the event',
      'question10': 'The speakers provided valuable and relevant information and insights',
      'question11': 'Faculty members/advisers were present for the entire duration of the activity',
      'question12': 'There was clear support from the administration/management',
      'question13': 'Cleanliness was upheld during and after the event'
    };
    return labels[questionKey] || questionKey;
  }
}

