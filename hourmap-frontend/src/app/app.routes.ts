import { Routes } from '@angular/router';
import { LoginRegisterComponent } from './components/login-register/login-register.component';
import { NewOrganizationComponent } from './components/new-organization/new-organization.component';
import { OrganizationDashboardComponent } from './components/organization-dashboard/organization-dashboard.component';

export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'login', component: LoginRegisterComponent },
    { path: 'register', component: LoginRegisterComponent }, // For registration, we're gonna pull which is in the URL for the form
    { path: 'create-organization', component: NewOrganizationComponent }, // TODO canActivate: [AuthGuard] },
    { path: 'organization-dashboard', component: OrganizationDashboardComponent } // TODO canActivate: [AuthGuard] }
];
