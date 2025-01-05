import { Routes } from '@angular/router';
import { LoginRegisterComponent } from './components/login-register/login-register.component';

export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'login', component: LoginRegisterComponent },
    { path: 'register', component: LoginRegisterComponent } // For registration, we're gonna pull which is in the URL for the form
];
