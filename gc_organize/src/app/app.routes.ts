import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ViewmodalComponent } from './viewmodal/viewmodal.component';
import { RegistermodalComponent } from './registermodal/registermodal.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { Component } from '@angular/core';
import { EventsregComponent } from './eventsreg/eventsreg.component';
import { LoginComponent } from './login/login.component';
import { ProfileComponent } from './profile/profile.component';
import { EcertificateComponent } from './ecertificate/ecertificate.component';

export const routes: Routes = [
  { path: '', redirectTo: 'sidebar', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'sidebar', component: SidebarComponent, 
    children: [
      { path: 'home', component: HomeComponent,
        children: [
          { path: 'profile', component: ProfileComponent }
        ]
       },
      { path: 'eventsreg', component: EventsregComponent },
      { path: 'ecertificate', component: EcertificateComponent }
  ] },
];
