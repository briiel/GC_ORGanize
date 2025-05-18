import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService } from '../modal.service';
import { RegistermodalComponent } from '../registermodal/registermodal.component';
import { ViewmodalComponent } from '../viewmodal/viewmodal.component';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { EventService } from '../services/event.service';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: true,
  imports: [CommonModule, RegistermodalComponent, ViewmodalComponent, RouterModule]
})
export class HomeComponent implements OnInit {
  dropdownVisible = false;
  notificationDropdownVisible = false;

  events: any[] = [];

  constructor(private eventService: EventService, private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.eventService.getAllEvents().subscribe(
      (data) => {
        console.log('Events API response:', data); // Check the structure in the browser console
        // Ensure events is always an array
        if (Array.isArray(data)) {
          this.events = data;
        } else if (data && Array.isArray(data.events)) {
          this.events = data.events;
        } else {
          this.events = [];
          console.error('Unexpected events data structure:', data);
        }
      },
      (error) => {
        console.error('Error fetching events:', error);
      }
    );
  }
  // Method to scroll to the top of the page
  /*scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }*/

  toggleDropdown() {
    this.dropdownVisible = !this.dropdownVisible;
    this.notificationDropdownVisible = false; // Hide notification dropdown when account dropdown is shown
    const dropdown = document.getElementById('dropdown');
    const notificationDropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
      dropdown.classList.toggle('hidden', !this.dropdownVisible);
    }
    if (notificationDropdown) {
      notificationDropdown.classList.add('hidden');
    }
  }

  toggleNotificationDropdown() {
    this.notificationDropdownVisible = !this.notificationDropdownVisible;
    this.dropdownVisible = false; // Hide account dropdown when notification dropdown is shown
    const notificationDropdown = document.getElementById('notificationDropdown');
    const dropdown = document.getElementById('dropdown');
    if (notificationDropdown) {
      notificationDropdown.classList.toggle('hidden', !this.notificationDropdownVisible);
    }
    if (dropdown) {
      dropdown.classList.add('hidden');
    }
  }

  updateBackgroundImage(event: Event, bgElementId: string): void {
    const imgElement = event.target as HTMLImageElement;
    const bgElement = document.getElementById(bgElementId);
    if (bgElement && imgElement) {
      bgElement.style.backgroundImage = `url('${imgElement.src}')`;
    }
  }

  isRegisterModalOpen = false;

  openRegisterModal() {
    this.isRegisterModalOpen = true;
  }

  closeRegisterModal() {
    this.isRegisterModalOpen = false;
  }

  isViewModalOpen = false;

  openViewModal() {
    this.isViewModalOpen = true;
  }

  closeViewModal() {
    this.isViewModalOpen = false;
  }


  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // displayedCards: Card[] = [];
  // currentPage = 1;
  // itemsPerPage = 10;
  // totalPages = 1;

  // constructor() {
  //   this.updateDisplayedCards();
  // }

  // updateDisplayedCards() {
  //   const startIndex = (this.currentPage - 1) * this.itemsPerPage;
  //   const endIndex = startIndex + this.itemsPerPage;
  //   this.displayedCards = this.cards.slice(startIndex, endIndex);
  //   this.totalPages = Math.ceil(this.cards.length / this.itemsPerPage);
  // }

  // changePage(page: number) {
  //   this.currentPage = page;
  //   this.updateDisplayedCards();
  // }

  // getPageNumbers(): number[] {
  //   return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  // }
  
}
