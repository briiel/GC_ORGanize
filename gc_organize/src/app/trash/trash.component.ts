import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventService } from '../services/event.service';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

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

	constructor(private eventService: EventService, private auth: AuthService) {}

	ngOnInit(): void {
	// Determine role for palette (OSWS vs Organization)
	this.role = this.auth.getUserRole();
		this.loadTrash();
	}

	loadTrash(): void {
		this.loading = true;
		this.error = null;
		this.eventService.getTrashedEvents().subscribe({
			next: (res) => {
				const data = res?.data ?? res ?? [];
				this.trashedEvents = Array.isArray(data) ? data : [];
				this.loading = false;
			},
			error: (err) => {
				this.error = err?.error?.message || 'Failed to load trash';
				this.loading = false;
			}
		});
	}

	restore(eventId: number): void {
		this.eventService.restoreEvent(eventId).subscribe({
			next: () => this.loadTrash(),
			error: (err) => this.error = err?.error?.message || 'Failed to restore'
		});
	}

	deleteForever(eventId: number): void {
		if (!confirm('Permanently delete this event? This cannot be undone.')) return;
		// Reuse delete API – on backend it is soft-delete, so here we would need a hard-delete endpoint to truly purge.
		// For now, just keep as is or extend backend later.
		alert('Permanent delete is not implemented on backend. Ask admin to purge from DB if needed.');
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

		posterUrl(ev: any): string | null {
			const url = ev?.event_poster;
			if (!url) return null;
			return typeof url === 'string' && url.startsWith('http') ? url : null;
		}

	// Convenience getter for styling
	get isOsws(): boolean { return this.role === 'osws_admin'; }
}
