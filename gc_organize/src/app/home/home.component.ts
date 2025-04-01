import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService } from '../modal.service';
import { RegistermodalComponent } from '../registermodal/registermodal.component';
import { ViewmodalComponent } from '../viewmodal/viewmodal.component';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

// interface Card {
//   id: number;
//   title: string;
//   description: string;
//   venue: string;
//   date: string;
//   time: string;
//   image: string;
// }

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: true,
  imports: [CommonModule, RegistermodalComponent, ViewmodalComponent, RouterModule]
})
export class HomeComponent {
  dropdownVisible = false;
  notificationDropdownVisible = false;

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

  constructor(private authService: AuthService, private router: Router) {}

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // cards: Card[] = [
  //   {
  //     id: 1,
  //     title: 'JPIA HEIST Event',
  //     description: 'Join us for an exciting accounting competition that tests your skills and knowledge.',
  //     venue: 'Conference Hall A',
  //     date: 'March 9, 2025',
  //     time: '10:00 AM',
  //     image: 'JPIA_HEIST.jpg'
  //   },
  //   {
  //     id: 2,
  //     title: 'JFINEX Operation',
  //     description: 'A financial management workshop designed to enhance your understanding of market operations.',
  //     venue: 'Conference Hall B',
  //     date: 'March 10, 2025',
  //     time: '11:00 AM',
  //     image: 'JFINEX_OPERATION.jpg'
  //   },
  //   {
  //     id: 3,
  //     title: 'ELITES DART Challenge',
  //     description: 'Participate in our annual dart tournament and showcase your precision skills.',
  //     venue: 'Conference Hall C',
  //     date: 'March 11, 2025',
  //     time: '12:00 PM',
  //     image: 'ELITES_DART.jpg'
  //   },
  //   {
  //     id: 4,
  //     title: 'CCSSC Machine Learning Workshop',
  //     description: 'Learn the basics of machine learning and its applications in modern technology.',
  //     venue: 'Conference Hall D',
  //     date: 'March 12, 2025',
  //     time: '1:00 PM',
  //     image: 'CCSSC_ML.jpg'
  //   },
  //   // Adding more dummy data to test pagination
  //   {
  //     id: 5,
  //     title: 'Web Development Bootcamp',
  //     description: 'Intensive training on modern web development technologies and frameworks.',
  //     venue: 'Lab Room A',
  //     date: 'March 15, 2025',
  //     time: '9:00 AM',
  //     image: 'JPIA_HEIST.jpg'
  //   },
  //   {
  //     id: 6,
  //     title: 'Cybersecurity Seminar',
  //     description: 'Learn about the latest trends and threats in cybersecurity.',
  //     venue: 'Auditorium',
  //     date: 'March 17, 2025',
  //     time: '2:00 PM',
  //     image: 'JFINEX_OPERATION.jpg'
  //   },
  //   {
  //     id: 7,
  //     title: 'Data Analytics Workshop',
  //     description: 'Master the fundamentals of data analysis and visualization.',
  //     venue: 'Lab Room B',
  //     date: 'March 20, 2025',
  //     time: '10:30 AM',
  //     image: 'ELITES_DART.jpg'
  //   },
  //   {
  //     id: 8,
  //     title: 'Mobile App Development',
  //     description: 'Learn to build mobile applications for iOS and Android.',
  //     venue: 'Conference Room E',
  //     date: 'March 22, 2025',
  //     time: '11:30 AM',
  //     image: 'CCSSC_ML.jpg'
  //   },
  //   {
  //     id: 9,
  //     title: 'Cloud Computing Basics',
  //     description: 'Introduction to cloud platforms and their applications.',
  //     venue: 'Virtual Meeting Room',
  //     date: 'March 25, 2025',
  //     time: '3:00 PM',
  //     image: 'JPIA_HEIST.jpg'
  //   },
  //   {
  //     id: 10,
  //     title: 'UI/UX Design Workshop',
  //     description: 'Learn the principles of user interface and experience design.',
  //     venue: 'Design Studio',
  //     date: 'March 27, 2025',
  //     time: '1:30 PM',
  //     image: 'JFINEX_OPERATION.jpg'
  //   },
  //   {
  //     id: 11,
  //     title: 'Blockchain Technology',
  //     description: 'Understanding the basics of blockchain and cryptocurrency.',
  //     venue: 'Conference Hall F',
  //     date: 'March 30, 2025',
  //     time: '2:30 PM',
  //     image: 'ELITES_DART.jpg'
  //   },
  //   {
  //     id: 12,
  //     title: 'Digital Marketing Essentials',
  //     description: 'Learn effective digital marketing strategies and tools.',
  //     venue: 'Marketing Lab',
  //     date: 'April 2, 2025',
  //     time: '10:00 AM',
  //     image: 'CCSSC_ML.jpg'
  //   }
  // ];

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
