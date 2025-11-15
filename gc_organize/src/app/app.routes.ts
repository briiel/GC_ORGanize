import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { Component } from '@angular/core';
import { EventsregComponent } from './eventsreg/eventsreg.component';
import { LoginComponent } from './login/login.component';
import { ProfileComponent } from './profile/profile.component';
import { EcertificateComponent } from './ecertificate/ecertificate.component';
import { AuthGuard } from './guards/auth.guard';
import { SoDashboardComponent } from './so-dashboard/so-dashboard.component';
import { ManageEventComponent } from './manage-event/manage-event.component';
import { ScanQrComponent } from './scan-qr/scan-qr.component';
import { AttendanceRecordsComponent } from './attendance-records/attendance-records.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { ManageUsersComponent } from './manage-users/manage-users.component';
import { HistoryComponent } from './history/history.component';
import { LandingComponent } from './landing/landing.component';
import { GuestGuard } from './guards/guest.guard';
import { EvaluationFormComponent } from './evaluation-form/evaluation-form.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [GuestGuard], data: { animation: 'LoginPage' } },
  { path: 'profile', component: ProfileComponent, data: { animation: 'ProfilePage' } },
  { 
    path: 'sidebar', 
    component: SidebarComponent, 
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    data: { animation: 'SidebarPage' },
    children: [
      { path: 'home', component: HomeComponent, data: { animation: 'HomePage' }, children: [
          { path: 'profile', component: ProfileComponent, data: { animation: 'ProfilePage' } }
        ]
      },
      { path: 'eventsreg', component: EventsregComponent, data: { animation: 'EventsRegPage' } },
      { path: 'ecertificate', component: EcertificateComponent, data: { animation: 'ECertificatePage' } },
      { path: 'evaluation/:eventId', component: EvaluationFormComponent, data: { animation: 'EvaluationPage', roles: ['student'] } },
  { path: 'history', component: HistoryComponent, data: { animation: 'HistoryPage', roles: ['student'] } },
      { path: 'so-dashboard', component: SoDashboardComponent, data: { animation: 'SoDashboardPage' } },
      { path: 'manage-event', component: ManageEventComponent, data: { animation: 'ManageEventPage' } },
  { path: 'scan-qr', component: ScanQrComponent, data: { animation: 'ScanQrPage', roles: ['organization', 'osws_admin'] } },
  { path: 'attendance-records', component: AttendanceRecordsComponent, data: { animation: 'AttendanceRecordsPage', roles: ['organization', 'osws_admin'] } },
  { path: 'trash', loadComponent: () => import('./trash/trash.component').then(m => m.TrashComponent), data: { animation: 'TrashPage', roles: ['organization', 'osws_admin'] } },
      { path: 'admin-dashboard', component: AdminDashboardComponent },
      { path: 'manage-users', component: ManageUsersComponent },
    ] 
  },
  // Public landing page at /home, blocked when logged-in
  { path: 'home', component: LandingComponent, canActivate: [GuestGuard], data: { animation: 'LandingPage' } },
  // Redirect root to /home
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  // Fallback
  { path: '**', redirectTo: 'home' },
];
