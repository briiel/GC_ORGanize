import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService } from '../modal.service';
import { RegistermodalComponent } from '../registermodal/registermodal.component';
import { ViewmodalComponent } from '../viewmodal/viewmodal.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: true,
  imports: [CommonModule, RegistermodalComponent, ViewmodalComponent]
})
export class HomeComponent {
  dropdownVisible = false;
  notificationDropdownVisible = false;

  // Method to scroll to the top of the page
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

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
}
