import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { Component } from '@angular/core';
import { EventsregComponent } from './eventsreg/eventsreg.component';
import { LoginComponent } from './login/login.component';
import { ProfileComponent } from './profile/profile.component';
import { EcertificateComponent } from './ecertificate/ecertificate.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
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
import { RequestRoleComponent } from './request-role/request-role.component';
import { RequestQueueComponent } from './request-queue/request-queue.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [GuestGuard], data: { animation: 'LoginPage' } },
  
  // Student Dashboard - requires Student role
  { 
    path: 'student-dashboard', 
    component: SidebarComponent, 
    canActivate: [AuthGuard, RoleGuard],
    canActivateChild: [AuthGuard],
    data: { animation: 'StudentDashboard', expectedRole: 'Student' },
    children: [
      { path: 'home', component: HomeComponent, data: { animation: 'HomePage' } },
      { path: 'profile', component: ProfileComponent, data: { animation: 'ProfilePage' } },
      { path: 'eventsreg', component: EventsregComponent, data: { animation: 'EventsRegPage' } },
      { path: 'ecertificate', component: EcertificateComponent, data: { animation: 'ECertificatePage' } },
      { path: 'evaluation/:eventId', component: EvaluationFormComponent, data: { animation: 'EvaluationPage' } },
      { path: 'history', component: HistoryComponent, data: { animation: 'HistoryPage' } },
      { path: 'request-role', component: RequestRoleComponent, data: { animation: 'RequestRolePage' } },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ] 
  },

  // Organization Panel - requires OrgOfficer role
  { 
    path: 'org-panel', 
    component: SidebarComponent, 
    canActivate: [AuthGuard, RoleGuard],
    canActivateChild: [AuthGuard],
    data: { animation: 'OrgPanel', expectedRole: 'OrgOfficer' },
    children: [
      { path: 'dashboard', component: SoDashboardComponent, data: { animation: 'SoDashboardPage' } },
      { path: 'manage-event', component: ManageEventComponent, data: { animation: 'ManageEventPage' } },
      { path: 'members', loadComponent: () => import('./org-members/org-members.component').then(m => m.OrgMembersComponent), data: { animation: 'OrgMembersPage' } },
      { path: 'certificate-requests', loadComponent: () => import('./certificate-requests/certificate-requests.component').then(m => m.CertificateRequestsComponent), data: { animation: 'CertificateRequestsPage' } },
      { path: 'scan-qr', component: ScanQrComponent, data: { animation: 'ScanQrPage' } },
      { path: 'attendance-records', component: AttendanceRecordsComponent, data: { animation: 'AttendanceRecordsPage' } },
      { path: 'trash', loadComponent: () => import('./trash/trash.component').then(m => m.TrashComponent), data: { animation: 'TrashPage' } },
      { path: 'profile', component: ProfileComponent, data: { animation: 'ProfilePage' } },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ] 
  },

  // OSWS Admin Panel - requires OSWSAdmin role
  { 
    path: 'osws-admin', 
    component: SidebarComponent, 
    canActivate: [AuthGuard, RoleGuard],
    canActivateChild: [AuthGuard],
    data: { animation: 'AdminPanel', expectedRole: 'OSWSAdmin' },
    children: [
      { path: 'dashboard', component: AdminDashboardComponent, data: { animation: 'AdminDashboardPage' } },
      { path: 'manage-users', component: ManageUsersComponent, data: { animation: 'ManageUsersPage' } },
      { path: 'manage-event', component: ManageEventComponent, data: { animation: 'ManageEventPage' } },
      { path: 'scan-qr', component: ScanQrComponent, data: { animation: 'ScanQrPage' } },
      { path: 'attendance-records', component: AttendanceRecordsComponent, data: { animation: 'AttendanceRecordsPage' } },
      { path: 'trash', loadComponent: () => import('./trash/trash.component').then(m => m.TrashComponent), data: { animation: 'TrashPage' } },
      { path: 'profile', component: ProfileComponent, data: { animation: 'ProfilePage' } },
      { path: 'role-requests', component: RequestQueueComponent, data: { animation: 'RequestQueuePage' } },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ] 
  },

  // Legacy sidebar route (kept for backward compatibility - will redirect based on role)
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
      { path: 'evaluation/:eventId', component: EvaluationFormComponent, data: { animation: 'EvaluationPage' } },
      { path: 'history', component: HistoryComponent, data: { animation: 'HistoryPage' } },
      { path: 'so-dashboard', component: SoDashboardComponent, data: { animation: 'SoDashboardPage' } },
      { path: 'manage-event', component: ManageEventComponent, data: { animation: 'ManageEventPage' } },
      { path: 'scan-qr', component: ScanQrComponent, data: { animation: 'ScanQrPage' } },
      { path: 'attendance-records', component: AttendanceRecordsComponent, data: { animation: 'AttendanceRecordsPage' } },
      { path: 'trash', loadComponent: () => import('./trash/trash.component').then(m => m.TrashComponent), data: { animation: 'TrashPage' } },
      { path: 'admin-dashboard', component: AdminDashboardComponent },
      { path: 'manage-users', component: ManageUsersComponent },
    ] 
  },

  { path: 'profile', component: ProfileComponent, data: { animation: 'ProfilePage' } },
  
  // Public landing page at /home, blocked when logged-in
  { path: 'home', component: LandingComponent, canActivate: [GuestGuard], data: { animation: 'LandingPage' } },
  
  // Redirect root to /home
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  
  // Fallback
  { path: '**', redirectTo: 'home' },
];
