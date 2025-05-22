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
import { CreateEventComponent } from './create-event/create-event.component';
import { ManageEventComponent } from './manage-event/manage-event.component';
import { ScanQrComponent } from './scan-qr/scan-qr.component';
import { AttendanceRecordsComponent } from './attendance-records/attendance-records.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, data: { animation: 'LoginPage' } },
  { path: 'profile', component: ProfileComponent, data: { animation: 'ProfilePage' } },
  { 
    path: 'sidebar', 
    component: SidebarComponent, 
    canActivate: [AuthGuard], 
    data: { animation: 'SidebarPage' },
    children: [
      { 
        path: 'home', 
        component: HomeComponent, 
        data: { animation: 'HomePage' },
        children: [
          { path: 'profile', component: ProfileComponent, data: { animation: 'ProfilePage' } }
        ]
      },
      { path: 'eventsreg', component: EventsregComponent, data: { animation: 'EventsRegPage' } },
      { path: 'ecertificate', component: EcertificateComponent, data: { animation: 'ECertificatePage' } },
      { path: 'so-dashboard', component: SoDashboardComponent, data: { animation: 'SoDashboardPage' } },
      { path: 'create-event', component: CreateEventComponent, data: { animation: 'CreateEventPage' } },
      { path: 'manage-event', component: ManageEventComponent, data: { animation: 'ManageEventPage' } },
      { path: 'scan-qr', component: ScanQrComponent, data: { animation: 'ScanQrPage' } },
      { path: 'attendance-records', component: AttendanceRecordsComponent, data: { animation: 'AttendanceRecordsPage' } },
    ] 
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
];
