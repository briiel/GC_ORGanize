import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ViewmodalComponent } from './viewmodal/viewmodal.component';
import { RegistermodalComponent } from './registermodal/registermodal.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { Component } from '@angular/core';
import { EventsregComponent } from './eventsreg/eventsreg.component';

export const routes: Routes = [
  { path: '', redirectTo: 'sidebar', pathMatch: 'full' },
  { path: 'sidebar', component: SidebarComponent, 
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'eventsreg', component: EventsregComponent } 
  ] },
];
