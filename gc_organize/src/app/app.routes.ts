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
  { path: 'login', component: LoginComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'sidebar', component: SidebarComponent, canActivate: [AuthGuard], 
    children: [
      { path: 'home', component: HomeComponent,
        children: [
          { path: 'profile', component: ProfileComponent }
        ]
       },
      { path: 'eventsreg', component: EventsregComponent },
      { path: 'ecertificate', component: EcertificateComponent },
      { path: 'so-dashboard', component: SoDashboardComponent},
      { path: 'create-event', component: CreateEventComponent},
      { path: 'manage-event', component: ManageEventComponent},
      { path: 'scan-qr', component: ScanQrComponent },
      { path: 'attendance-records', component: AttendanceRecordsComponent },
  ] },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
];
