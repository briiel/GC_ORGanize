import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationItem, NotificationService } from '../services/notification.service';
import { normalizeList } from '../utils/api-utils';
import { Subject, merge, timer } from 'rxjs';
import { switchMap, takeUntil, debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.css']
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  @Input() panel: string | null = null;
  @Input() orgId: number | null = null;
  open = false;
  items: NotificationItem[] = [];
  loading = false;

  /** Completes all subscriptions when the component is destroyed. */
  private destroy$ = new Subject<void>();
  /** On-demand refresh trigger (visibility changes, post-action refreshes, etc.). */
  private manualRefresh$ = new Subject<void>();
  private visibilityHandler = () => { if (!document.hidden) this.manualRefresh$.next(); };

  constructor(private api: NotificationService) { }

  ngOnInit(): void {
    /**
     * Single reactive pipeline:
     *  - timer(0, 30_000) fires immediately for the initial load, then every 30 s
     *  - manualRefresh$ handles on-demand triggers (tab focus, post-action)
     *  - debounceTime(300) collapses bursts (e.g. timer + visibility firing together)
     *  - switchMap cancels any in-flight request before starting the next one
     *  - takeUntil(destroy$) auto-unsubscribes when the component is destroyed
     */
    merge(
      timer(0, 30_000),
      this.manualRefresh$
    ).pipe(
      debounceTime(300),
      switchMap(() => {
        this.loading = true;
        return this.api.list(this.panel ?? undefined, this.orgId ?? undefined);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (res: any) => {
        this.items = normalizeList(res) as NotificationItem[];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });

    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  // Return header style based on current panel
  getHeaderStyle(): { [key: string]: string } {
    // Default colors (organization/student)
    let bg = '#0f172a'; // dark slate-900 as default header background
    let border = '#0b1220';

    const p = (this.panel || '').toLowerCase();
    if (p === 'student' || p === 'organization') {
      bg = '#1f8a17'; // green tone similar to app theme
      border = '#16720f';
    } else if (p === 'osws_admin' || p === 'osws') {
      bg = '#0f3a1a'; // darker green for OSWS admin
      border = '#0b2b13';
    }

    return {
      'background': bg,
      'border-bottom': `2px solid ${border}`
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('visibilitychange', this.visibilityHandler);
  }

  toggle() {
    this.open = !this.open;
    // No manual refresh needed — the poller keeps items up-to-date
  }

  unreadCount(): number {
    return this.items.filter(i => !i.is_read || Number(i.is_read) === 0).length;
  }

  /** Manually trigger a refresh (e.g. after marking read). */
  refresh() {
    this.manualRefresh$.next();
  }

  markRead(item: NotificationItem, idx: number) {
    if (item.is_read) return;
    this.api.markRead(item.id).subscribe(() => {
      this.items[idx] = { ...item, is_read: true } as any;
    });
  }

  markAll() {
    if (!this.items || this.items.length === 0) return;
    this.api.markAll(this.panel ?? undefined, this.orgId ?? undefined).subscribe(() => {
      this.items = this.items.map(i => ({ ...i, is_read: true } as any));
      // Sync with server state after bulk-mark
      this.manualRefresh$.next();
    });
  }

  getNotificationIcon(item: NotificationItem): string {
    const msg = item.message.toLowerCase();
    if (msg.includes('approved') || msg.includes('confirmed')) {
      return 'fas fa-check-circle';
    }
    if (msg.includes('rejected') || msg.includes('declined') || msg.includes('not approved')) {
      return 'fas fa-times-circle';
    }
    if (msg.includes('pending') || msg.includes('submitted')) {
      return 'fas fa-hourglass-half';
    }
    if (msg.includes('certificate')) {
      return 'fas fa-certificate';
    }
    if (msg.includes('registered') || msg.includes('registration')) {
      return 'fas fa-user-check';
    }
    return 'fas fa-bell';
  }

  getNotificationIconClass(item: NotificationItem): string {
    const msg = item.message.toLowerCase();
    if (msg.includes('approved') || msg.includes('confirmed')) {
      return item.is_read ? 'bg-green-300' : 'bg-green-500';
    }
    if (msg.includes('rejected') || msg.includes('declined') || msg.includes('not approved')) {
      return item.is_read ? 'bg-red-300' : 'bg-red-500';
    }
    if (msg.includes('pending') || msg.includes('submitted')) {
      return item.is_read ? 'bg-yellow-300' : 'bg-yellow-500';
    }
    if (msg.includes('certificate')) {
      return item.is_read ? 'bg-blue-300' : 'bg-blue-500';
    }
    return item.is_read ? 'bg-gray-300' : 'bg-[#679436]';
  }
}
