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

  getNotificationIcon(item: NotificationItem): string {
    const msg = item.message.toLowerCase();
    if (msg.includes('✅') || msg.includes('approved') || msg.includes('confirmed')) {
      return 'fas fa-check-circle';
    }
    if (msg.includes('❌') || msg.includes('rejected') || msg.includes('not approved')) {
      return 'fas fa-times-circle';
    }
    if (msg.includes('⏳') || msg.includes('pending') || msg.includes('submitted')) {
      return 'fas fa-hourglass-half';
    }
    if (msg.includes('📜') || msg.includes('certificate')) {
      return 'fas fa-certificate';
    }
    if (msg.includes('registered') || msg.includes('registration')) {
      return 'fas fa-user-check';
    }
    return 'fas fa-bell';
  }

  getNotificationIconClass(item: NotificationItem): string {
    const msg = item.message.toLowerCase();
    if (msg.includes('✅') || msg.includes('approved') || msg.includes('confirmed')) {
      return item.is_read ? 'bg-green-300' : 'bg-green-500';
    }
    if (msg.includes('❌') || msg.includes('rejected') || msg.includes('not approved')) {
      return item.is_read ? 'bg-red-300' : 'bg-red-500';
    }
    if (msg.includes('⏳') || msg.includes('pending') || msg.includes('submitted')) {
      return item.is_read ? 'bg-yellow-300' : 'bg-yellow-500';
    }
    if (msg.includes('📜') || msg.includes('certificate')) {
      return item.is_read ? 'bg-blue-300' : 'bg-blue-500';
    }
    return item.is_read ? 'bg-gray-300' : 'bg-[#679436]';
  }
}
