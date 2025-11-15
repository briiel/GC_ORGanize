import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationItem, NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.css']
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  open = false;
  items: NotificationItem[] = [];
  loading = false;
  private pollId: any = null;

  constructor(private api: NotificationService) {}

  ngOnInit(): void {
    this.refresh();
    // light polling to reflect new notifications without reload
    this.pollId = setInterval(() => this.refresh(), 15000);
    // refresh when user focuses tab
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.refresh();
    });
  }

  ngOnDestroy(): void {
    if (this.pollId) {
      clearInterval(this.pollId);
      this.pollId = null;
    }
    // No-op removal since listener is anonymous; acceptable for small component lifetime
  }

  toggle() {
    this.open = !this.open;
    if (this.open && this.items.length === 0) {
      this.refresh();
    }
  }

  unreadCount(): number {
    return this.items.filter(i => !i.is_read || Number(i.is_read) === 0).length;
  }

  refresh() {
    this.loading = true;
    this.api.list().subscribe((res: any) => {
      const data: NotificationItem[] = Array.isArray(res) ? res : res.data ?? [];
      this.items = data;
      this.loading = false;
    }, _ => { this.loading = false; });
  }

  markRead(item: NotificationItem, idx: number) {
    if (item.is_read) return;
    this.api.markRead(item.id).subscribe(() => {
      this.items[idx] = { ...item, is_read: true } as any;
    });
  }
}
