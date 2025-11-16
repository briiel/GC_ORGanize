import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventService } from '../services/event.service';
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
	trashedEvents: any[] = [];
	loading = false;
	error: string | null = null;
	search = '';
	role: string | null = null;
	// Pagination: 3x3 layout per page
	currentPage: number = 1;
	pageSize: number = 9;

	constructor(private eventService: EventService, private auth: RbacAuthService) {}

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
		this.eventService.getTrashedEvents().subscribe({
			next: (res: any) => {
				const data = res?.data ?? res ?? [];
				this.trashedEvents = Array.isArray(data) ? data : [];
				this.loading = false;
				// Reset to first page when data updates
				this.currentPage = 1;
			},
			error: (err: any) => {
				this.error = err?.error?.message || 'Failed to load trash';
				this.loading = false;
			}
		});
	}

	restore(eventId: number): void {
		this.eventService.restoreEvent(eventId).subscribe({
			next: () => this.loadTrash(),
			error: (err: any) => this.error = err?.error?.message || 'Failed to restore'
		});
	}

	deleteForever(eventId: number): void {
		Swal.fire({
			title: 'Permanently delete this event?',
			text: 'This action cannot be undone.',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Delete',
			cancelButtonText: 'Cancel',
			confirmButtonColor: '#d33',
			reverseButtons: true
		}).then((result) => {
			if (!result.isConfirmed) return;
			Swal.fire({
				title: 'Deleting…',
				allowOutsideClick: false,
				allowEscapeKey: false,
				showConfirmButton: false,
				didOpen: () => Swal.showLoading()
			});
			this.eventService.permanentDelete(eventId).subscribe({
				next: () => {
					Swal.close();
					Swal.fire({ icon: 'success', title: 'Deleted', timer: 1200, showConfirmButton: false });
					this.loadTrash();
				},
				error: (err: any) => {
					Swal.close();
					const msg = err?.error?.message || 'Failed to permanently delete';
					this.error = msg;
					Swal.fire({ icon: 'error', title: 'Delete failed', text: msg });
				}
			});
		});
	}

		get filtered(): any[] {
			const q = (this.search || '').trim().toLowerCase();
			if (!q) return this.trashedEvents;
			return this.trashedEvents.filter(e =>
				(e.title && e.title.toLowerCase().includes(q)) ||
				(e.department && e.department.toLowerCase().includes(q)) ||
				(e.org_name && e.org_name.toLowerCase().includes(q)) ||
				(e.admin_name && e.admin_name.toLowerCase().includes(q)) ||
				(e.location && e.location.toLowerCase().includes(q))
			);
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

	// Convenience getter for styling
	get isOsws(): boolean { return this.role === 'osws_admin'; }
}
