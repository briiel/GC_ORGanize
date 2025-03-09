import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ViewmodalComponent } from './viewmodal/viewmodal.component';
import { RegistermodalComponent } from './registermodal/registermodal.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
];
