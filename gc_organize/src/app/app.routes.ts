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

export const routes: Routes = [
  { path: 'login', component: LoginComponent, data: { animation: 'LoginPage' } },
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
      { path: 'so-dashboard', component: SoDashboardComponent, data: { animation: 'SoDashboardPage' } },
      { path: 'manage-event', component: ManageEventComponent, data: { animation: 'ManageEventPage' } },
  { path: 'scan-qr', component: ScanQrComponent, data: { animation: 'ScanQrPage', roles: ['organization', 'osws_admin'] } },
  { path: 'attendance-records', component: AttendanceRecordsComponent, data: { animation: 'AttendanceRecordsPage', roles: ['organization', 'osws_admin'] } },
      { path: 'admin-dashboard', component: AdminDashboardComponent },
      { path: 'manage-users', component: ManageUsersComponent },
    ] 
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
];
