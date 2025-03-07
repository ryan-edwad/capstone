import { Routes } from '@angular/router';
import { LoginRegisterComponent } from './components/login-register/login-register.component';
import { NewOrganizationComponent } from './components/new-organization/new-organization.component';
import { OrganizationDashboardComponent } from './components/organization-dashboard/organization-dashboard.component';
import { authGuard } from './_guards/auth.guard';
import { TimeclockComponent } from './components/timeclock/timeclock.component';
import { ReportsComponent } from './components/reports/reports.component';
import { EditProfileComponent } from './components/edit-profile/edit-profile.component';
import { HomePageComponent } from './components/home-page/home-page.component';

export const routes: Routes = [
    { path: 'login', component: LoginRegisterComponent },
    { path: 'register', component: LoginRegisterComponent }, // For registration, we're gonna pull which is in the URL for the form
    {
        path: 'create-organization',
        component: NewOrganizationComponent,
        canActivate: [authGuard],
        data: { roles: ['Manager', 'Admin'] }
    },
    {
        path: 'organization-dashboard',
        component: OrganizationDashboardComponent,
        canActivate: [authGuard],
        data: { roles: ['Manager', 'Admin'] }
    },
    {
        path: 'timeclock',
        component: TimeclockComponent,
        canActivate: [authGuard],
        data: { roles: ['Manager', 'Admin', 'Employee'] }
    },
    {
        path: 'reports',
        component: ReportsComponent,
        canActivate: [authGuard],
        data: { roles: ['Manager', 'Admin'] }
    },
    {
        path: 'user-profile',
        component: EditProfileComponent,
        canActivate: [authGuard],
        data: { roles: ['Manager', 'Admin', 'Employee'] }
    },
    {
        path: '**',
        component: HomePageComponent
    }

];
