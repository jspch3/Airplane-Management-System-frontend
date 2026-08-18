import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { UserDashboardComponent } from './components/user-dashboard/user-dashboard.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { ProfileComponent } from './components/profile/profile.component';
import { CarrierListComponent } from './components/carrier-list/carrier-list.component';
import { CarrierFormComponent } from './components/carrier-form/carrier-form.component';
import { FlightFormComponent } from './components/flight-form/flight-form.component';
import { FlightListComponent } from './components/flight-list/flight-list.component';
import { BookFlightComponent } from './components/book-flight/book-flight.component';
import { BookingListComponent } from './components/booking-list/booking-list.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: UserDashboardComponent },
  { path: 'admin/dashboard', component: AdminDashboardComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'flights', component: FlightListComponent },
  { path: 'book-flight', component: BookFlightComponent },
  { path: 'bookings', component: BookingListComponent },
  { path: 'admin/carriers', component: CarrierListComponent },
  { path: 'admin/carriers/new', component: CarrierFormComponent },
  { path: 'admin/carriers/edit/:id', component: CarrierFormComponent },
  { path: 'admin/flights/new', component: FlightFormComponent },
  { path: 'admin/flights/edit/:id', component: FlightFormComponent },
  { path: '**', redirectTo: 'login' }
];
