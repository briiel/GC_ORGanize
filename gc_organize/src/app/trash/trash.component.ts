import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventService } from '../services/event.service';
import { ArchiveService } from '../services/archive.service';
import { normalizeList, normalizeSingle } from '../utils/api-utils';
import { FormsModule } from '@angular/forms';
import { RbacAuthService } from '../services/rbac-auth.service';
import Swal from 'sweetalert2';

@Component({
	selector: 'app-trash',
	standalone: true,
		imports: [CommonModule, FormsModule],
	templateUrl: './trash.component.html',
	styleUrls: ['./trash.component.css']
})
export class TrashComponent implements OnInit {
	// Different types of trashed items
	trashedEvents: any[] = [];
	trashedAdmins: any[] = [];
	trashedOrganizations: any[] = [];
	trashedMembers: any[] = [];
	
	// Active tab
	activeTab: 'events' | 'admins' | 'organizations' | 'members' = 'events';
	
	loading = false;
	error: string | null = null;
	search = '';
	role: string | null = null;
	
	// Pagination: 3x3 layout per page for events, more for tables
	currentPage: number = 1;
	pageSize: number = 9;
	
	// Loading states for individual actions
	restoringId: number | null = null;
	deletingId: number | null = null;

	constructor(
		private eventService: EventService,
		private archiveService: ArchiveService,
		private auth: RbacAuthService
	) {}

	ngOnInit(): void {
		// Determine role for palette (OSWS vs Organization)
		const primaryRole = this.auth.getPrimaryRole();
		if (primaryRole === 'OSWSAdmin') {
			this.role = 'osws_admin';
		} else if (primaryRole === 'OrgOfficer') {
			this.role = 'organization';
		} else if (primaryRole === 'Student') {
			this.role = 'student';
		}
		this.loadTrash();
	}

	loadTrash(): void {
		this.loading = true;
		this.error = null;
		
		// Load events
		this.eventService.getTrashedEvents().subscribe({
				next: (res: any) => {
					this.trashedEvents = normalizeList(res);
			},
			error: (err: any) => {
				console.error('Error loading trashed events:', err);
			}
		});
		
		// Load users and members
		this.archiveService.getTrash().subscribe({
			next: (res: any) => {
				const data = normalizeSingle(res) || res;
				this.trashedAdmins = data?.admins || [];
				this.trashedOrganizations = data?.organizations || [];
				this.trashedMembers = data?.members || [];
				this.loading = false;
				this.currentPage = 1;
			},
			error: (err: any) => {
				this.error = err?.error?.message || 'Failed to load archived items';
				this.loading = false;
			}
		});
	}

	// Switch between tabs
	setActiveTab(tab: 'events' | 'admins' | 'organizations' | 'members'): void {
		this.activeTab = tab;
		this.currentPage = 1;
		this.search = '';
	}

	// Get current data based on active tab
	get currentData(): any[] {
		switch (this.activeTab) {
			case 'events': return this.trashedEvents;
			case 'admins': return this.trashedAdmins;
			case 'organizations': return this.trashedOrganizations;
			case 'members': return this.trashedMembers;
			default: return [];
		}
	}

	// Restore operations
	restore(item: any): void {
		this.restoringId = item.id || item.event_id || item.member_id;
		
		let restoreObservable;
		switch (this.activeTab) {
			case 'events':
				restoreObservable = this.eventService.restoreEvent(item.event_id);
				break;
			case 'admins':
				restoreObservable = this.archiveService.restoreAdmin(item.id);
				break;
			case 'organizations':
				restoreObservable = this.archiveService.restoreOrganization(item.id);
				break;
			case 'members':
				restoreObservable = this.archiveService.restoreMember(item.member_id);
				break;
			default:
				this.restoringId = null;
				return;
		}
		
		restoreObservable.subscribe({
			next: () => {
				this.restoringId = null;
				Swal.fire({ icon: 'success', title: 'Restored', timer: 1200, showConfirmButton: false });
				this.loadTrash();
			},
			error: (err: any) => {
				this.restoringId = null;
				const msg = err?.error?.message || 'Failed to restore';
				Swal.fire({ icon: 'error', title: 'Restore failed', text: msg });
			}
		});
	}

	// Delete forever operations
	deleteForever(item: any): void {
		const itemName = item.title || item.name || item.org_name || 
		                 `${item.first_name || ''} ${item.last_name || ''}`.trim();
		
		Swal.fire({
			title: 'Permanently delete this item?',
			text: `${itemName}\n\nThis action cannot be undone.`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Delete',
			cancelButtonText: 'Cancel',
			confirmButtonColor: '#d33',
			reverseButtons: true
		}).then((result) => {
			if (!result.isConfirmed) return;
			
			this.deletingId = item.id || item.event_id || item.member_id;
			Swal.fire({
				title: 'Deleting…',
				allowOutsideClick: false,
				allowEscapeKey: false,
				showConfirmButton: false,
				didOpen: () => Swal.showLoading()
			});
			
			let deleteObservable;
			switch (this.activeTab) {
				case 'events':
					deleteObservable = this.eventService.permanentDelete(item.event_id);
					break;
				case 'admins':
					deleteObservable = this.archiveService.permanentDeleteAdmin(item.id);
					break;
				case 'organizations':
					deleteObservable = this.archiveService.permanentDeleteOrganization(item.id);
					break;
				case 'members':
					deleteObservable = this.archiveService.permanentDeleteMember(item.member_id);
					break;
				default:
					this.deletingId = null;
					Swal.close();
					return;
			}
			
			deleteObservable.subscribe({
				next: () => {
					this.deletingId = null;
					Swal.close();
					Swal.fire({ icon: 'success', title: 'Deleted', timer: 1200, showConfirmButton: false });
					this.loadTrash();
				},
				error: (err: any) => {
					this.deletingId = null;
					Swal.close();
					const msg = err?.error?.message || 'Failed to permanently delete';
					Swal.fire({ icon: 'error', title: 'Delete failed', text: msg });
				}
			});
		});
	}

	// Filtering
	get filtered(): any[] {
		const q = (this.search || '').trim().toLowerCase();
		if (!q) return this.currentData;
		
		return this.currentData.filter(item => {
			const searchableText = [
				item.title,
				item.name,
				item.org_name,
				item.email,
				item.department,
				item.admin_name,
				item.location,
				item.first_name,
				item.last_name,
				item.position
			].filter(Boolean).join(' ').toLowerCase();
			
			return searchableText.includes(q);
		});
	}

	// Paginated view of filtered items
	get paginated(): any[] {
		const start = (this.currentPage - 1) * this.pageSize;
		return this.filtered.slice(start, start + this.pageSize);
	}

	get totalPages(): number {
		return Math.ceil(this.filtered.length / this.pageSize) || 1;
	}

	changePage(page: number): void {
		if (page < 1 || page > this.totalPages) return;
		this.currentPage = page;
	}

	onSearchChange(value: string): void {
		this.search = value;
		this.currentPage = 1;
	}

	posterUrl(ev: any): string | null {
		const url = ev?.event_poster;
		if (!url) return null;
		return typeof url === 'string' && url.startsWith('http') ? url : null;
	}

	// Helper to get full name
	getFullName(item: any): string {
		const parts = [item.first_name, item.middle_initial, item.last_name, item.suffix]
			.filter(Boolean);
		return parts.join(' ');
	}

	// Convenience getter for styling
	get isOsws(): boolean { return this.role === 'osws_admin'; }
	
	// Check if user can see certain tabs
	get canSeeAdminsTab(): boolean {
		return this.role === 'osws_admin';
	}
	
	get canSeeOrganizationsTab(): boolean {
		return false; // Hidden for all users
	}
	
	get canSeeMembersTab(): boolean {
		return this.role === 'organization'; // Only org officers, not OSWS admins
	}
}
