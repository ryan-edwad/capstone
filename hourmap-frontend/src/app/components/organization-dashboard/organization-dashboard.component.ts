import { ChangeDetectorRef, Component, HostListener } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AddUserComponent } from '../add-user/add-user.component';
import { EditUserComponent } from '../edit-user/edit-user.component';
import { Router } from '@angular/router';
import { OrganizationService } from '../../_services/organization.service';
import { Organization } from '../../_models/organization';
import { OrgUser } from '../../_models/org-user';
import { CommonModule } from '@angular/common';
import { jwtDecode } from 'jwt-decode';
import { Invitation } from '../../_models/invitation';
import { Project } from '../../_models/project';
import { NewProjectComponent } from '../new-project/new-project.component';
import { EditProjectComponent } from '../edit-project/edit-project.component';
import { WorkLocation } from '../../_models/work-location';
import { AddLocationComponent } from '../add-location/add-location.component';
import { AssignProjectComponent } from '../assign-project/assign-project.component';
import { FormsModule } from '@angular/forms';
import { EditLocationComponent } from '../edit-location/edit-location.component';
import { OrganizationDataService } from '../../_services/organization-data.service';
import { TreasurePathBackgroundComponent } from "../treasure-path-background/treasure-path-background.component";
import { AccountService } from '../../_services/account.service';
import { MatTooltipModule } from '@angular/material/tooltip';
/**
 * Organization dashboard component, where most of everything happens in this app. 
 */
@Component({
  selector: 'app-organization-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, TreasurePathBackgroundComponent, MatTooltipModule],
  templateUrl: './organization-dashboard.component.html',
  styleUrl: './organization-dashboard.component.css'
})
export class OrganizationDashboardComponent {
  organization: Organization = { id: 0, name: 'Default Loaded, Check the Logs', createdAt: new Date(), users: [], projects: [], locations: [], invitations: [] };
  selectedUser: OrgUser | null = null;
  selectedInvitation: Invitation | null = null;
  selectedProject: Project | null = null;
  selectedLocation: WorkLocation | null = null;
  invitations: Invitation[] = [];
  filteredProjects: Project[] = [];
  filteredUsers: OrgUser[] = [];
  filteredInvitations: Invitation[] = [];
  showOnlyEnabledProjects: boolean = false;
  showOnlyEnabledUsers: boolean = false;
  searchUsersQuery: string = '';
  searchInvitationsQuery: string = '';
  searchProjectsQuery: string = '';
  currentUserId: string | null = null;
  sortColumn: string = ''
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(private organizationService: OrganizationService, private router: Router, private dialog: MatDialog, private organizationDataService: OrganizationDataService, private accountService: AccountService, private cdr: ChangeDetectorRef) { }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;

    const isInsideTable = target.closest('table');
    if (!isInsideTable) {
      this.clearSelections();
    }
  }

  clearSelections() {
    this.selectedUser = null;
    this.selectedInvitation = null;
    this.selectedProject = null;
    this.selectedLocation = null;
  }

  ngOnInit() {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error("No authentication found. Please log in.");
      this.router.navigate(['/login']);
      return;
    }
    this.accountService.currentUserId$.subscribe(userId => { this.currentUserId = userId });

    let organizationId: number | null = null;
    try {
      const decodedToken: any = jwtDecode(token);
      console.log('Decoded token:', decodedToken);
      organizationId = decodedToken.OrganizationId ? parseInt(decodedToken.OrganizationId) : 0;
    } catch (err) {
      console.error('Failed to decode token:', err);
      this.router.navigate(['/login']);
      return;
    }

    if (!organizationId || typeof organizationId !== 'number') {
      console.error('Invalid organization ID');
      this.router.navigate(['/login']); // Go back to login bro
    }

    this.organizationDataService.getOrganization(organizationId).subscribe({
      next: (data) => {
        this.organization = {
          ...data,
          users: data.users || [],
          projects: data.projects || [],
          locations: data.locations || [],
          invitations: data.invitations || []
        };
        this.filteredProjects = [...this.organization.projects];
        this.filteredUsers = [...this.organization.users];
        this.filteredInvitations = [...this.organization.invitations];
        console.log('Invitations:', this.organization.invitations);
        console.log('Filtered Invitations:', this.filteredInvitations);
        console.log('Loaded organization data:', this.organization);
      },
      error: (err) => console.error('Failed to load organization data:', err)
    });
  }

  filterInvitations() {
    const query = this.searchInvitationsQuery?.toLowerCase() || '';
    this.filteredInvitations = this.invitations.filter(invite =>
      invite.email.toLowerCase().includes(query));
  }

  // Select a user
  selectUser(orgUser: OrgUser) {
    this.selectedUser = orgUser;
  }

  selectInvitation(invitation: Invitation) {
    this.selectedInvitation = invitation;
  }

  // Add a user
  addUser() {
    const dialogRef = this.dialog.open(AddUserComponent, {
      width: '400px',
      data: { organizationId: this.organization?.id },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('Add user dialog closed!');
      if (result === true) {
        console.log('Refreshing organization data');
        this.organizationDataService.clearCache(this.organization.id);
        this.refreshOrganization();
      }
    });
  }

  // Edit a user
  editUser() {
    if (!this.selectedUser) {
      console.error('No user selected to edit');
      return;
    }

    console.log('Selected user:', this.selectedUser);

    const dialogRef = this.dialog.open(EditUserComponent, {
      width: '400px',
      data: {
        user: this.selectedUser
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('Edit user dialog closed:', result);
      if (result === true) {
        console.log('Refreshing organization data');
        this.organizationDataService.clearCache(this.organization.id);
        this.refreshOrganization();
      }
    });
  }

  // Disable/enable sign-in for a user
  changeUserSignInStatus() {
    if (this.selectedUser) {
      if (this.selectedUser.loginEnabled) {
        this.organizationService.disableUser(this.selectedUser.id).subscribe({
          next: (data) => {
            console.log(data);
            this.refreshOrganization();
          },
          error: (err) => console.error('Failed to disable user: ', err)
        });
      }
      else {
        this.organizationService.enableUser(this.selectedUser.id).subscribe({
          next: (data) => {
            console.log(data);
            this.refreshOrganization();
          },
          error: (err) => console.error('Failed to enable user: ', err)
        });
      }
    }
  }

  // Promote or demote user
  changeUserAdminStatus() {
    if (this.selectedUser && this.currentUserId !== this.selectedUser.id) {
      if (this.selectedUser.roles.includes('Manager')) {
        if (window.confirm('Are you sure you want to demote this user?')) {
          this.organizationService.demoteUser(this.selectedUser.id).subscribe({
            next: (data) => {
              console.log(data);
              this.refreshOrganization();
            },
            error: (err) => console.error('Failed to demote user: ', err)
          });
        }
      }
      else {
        if (window.confirm('Are you sure you want to promote this user?')) {
          this.organizationService.promoteUser(this.selectedUser.id).subscribe({
            next: (data) => {
              console.log(data);
              this.refreshOrganization();
            },
            error: (err) => console.error('Failed to promote user: ', err)
          });
        }

      }
    }
  }

  // Delete an existing invitation
  deleteInvite() {
    if (this.selectedInvitation) {
      this.organizationService.deleteInvitation(this.selectedInvitation.id).subscribe({
        next: (data) => {
          console.log('Invitation deleted:', data);

          // Remove the deleted invitation from the local list
          this.invitations = this.invitations.filter(
            (invitation) => invitation.id !== this.selectedInvitation?.id
          );

          // Reset the selected invitation
          this.selectedInvitation = null;

          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to delete invitation: ', err);
          if (err.error?.message) {
            console.error(err.error.message);
          }
        },
      });
    }
  }

  // Copies a link, obviously
  copyLink() {
    if (this.selectedInvitation) {
      const link = `${window.location.origin}/register/?token=${this.selectedInvitation.token}`;
      navigator.clipboard.writeText(link).then(() => {
        console.log('Copied link to clipboard:', link);
        alert('Link copied to clipboard!');
      }, (err) => {
        console.error('Failed to copy link to clipboard:', err);
      });
    }
  }

  // Try and handle changes to the organization
  refreshOrganization() {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error("No authentication found. Please log in.");
      this.router.navigate(['/login']);
      return;
    }

    let organizationId: number | null = null;
    try {
      const decodedToken: any = jwtDecode(token);
      console.log('Decoded token:', decodedToken);
      organizationId = decodedToken.OrganizationId ? parseInt(decodedToken.OrganizationId) : 0;
    } catch (err) {
      console.error('Failed to decode token:', err);
      this.router.navigate(['/login']);
      return;
    }

    if (!organizationId || typeof organizationId !== 'number') {
      console.error('Invalid organization ID');
      this.router.navigate(['/login']);
      return;
    }

    // Moving toward a cached service instead
    this.organizationDataService.clearCache(organizationId);
    this.organizationDataService.getOrganization(organizationId).subscribe({
      next: (data) => {
        this.organization = {
          ...data,
          users: data.users || [],
          projects: data.projects || [],
          locations: data.locations || []
        };
        this.filteredProjects = [...this.organization.projects];
        this.filteredUsers = [...this.organization.users];
        this.filteredInvitations = [...this.organization.invitations];
        console.log('Organization data refreshed:', this.organization);
      },
      error: (err) => console.error('Failed to refresh organization data:', err)
    });

  }

  // Add a project to an organization
  addProject() {
    const dialogRef = this.dialog.open(NewProjectComponent, {
      width: '400px',
      data: { organizationId: this.organization?.id },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('Dialog closed!');
      if (result === true) {
        console.log('Refreshing organization data');
        this.organizationDataService.clearCache(this.organization.id);
        this.refreshOrganization();
      }
    });
  }

  editProject() {
    const dialogRef = this.dialog.open(EditProjectComponent, {
      width: '400px',
      data: this.selectedProject,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('Edit project dialog closed:', result);
      if (result === true) {
        console.log('Refreshing organization data');
        this.organizationDataService.clearCache(this.organization.id);
        this.refreshOrganization();
      }
    });
  }

  assignProject() {
    console.log(this.organization.users);
    const dialogRef = this.dialog.open(AssignProjectComponent, {
      width: '400px',
      height: '50vh',
      data: {
        project: this.selectedProject,
        users: this.organization.users
      },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('Assign project dialog closed:', result);
      if (result === true) {
        console.log('Updated project users! Nice!');
        console.log('Refreshing organization data');
        this.organizationDataService.clearCache(this.organization.id);
        this.refreshOrganization();
      } else {
        console.log('Closed without saving project users.');
      }
    });
  }

  selectProject(project: Project) {
    this.selectedProject = project;
  }

  changeProjectStatus() {
    if (this.selectedProject) {
      this.selectedProject.enabled ? this.selectedProject.enabled = false : this.selectedProject.enabled = true;
      this.organizationService.updateProject(this.selectedProject).subscribe({
        next: (data) => {
          console.log(data);
          this.organizationDataService.clearCache(this.organization.id);
          this.refreshOrganization();
          this.selectedProject = null;
        },
        error: (err) => console.error('Failed to disable/enable project: ', err)
      });
    }
  }

  filterUsers() {
    const query = this.searchUsersQuery?.toLowerCase() || '';
    this.filteredUsers = this.organization.users.filter(user =>
      user.firstName.toLowerCase().includes(query) ||
      user.lastName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );

    if (this.showOnlyEnabledUsers) {
      this.filteredUsers = this.filteredUsers.filter(user => user.loginEnabled);
    }
  }

  filterProjects() {
    const query = this.searchProjectsQuery?.toLowerCase() || '';
    this.filteredProjects = this.organization.projects.filter(project =>
      project.name.toLowerCase().includes(query) || project.description.toLowerCase().includes(query)
    );
    if (this.showOnlyEnabledProjects) {
      this.filteredProjects = this.organization.projects.filter(p => p.enabled);
    }
  }

  selectLocation(workLocation: WorkLocation) {
    this.selectedLocation = workLocation;
  }

  addLocation() {
    const dialogRef = this.dialog.open(AddLocationComponent, {
      width: '400px',
      data: { organizationId: this.organization?.id },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('Add location dialog closed:', result);
      if (result === true) {
        console.log('Refreshing organization data');
        this.organizationDataService.clearCache(this.organization.id);
        this.refreshOrganization();
      }
    });

  }

  editLocation() {
    // Open a dialog to edit a location
    const dialogRef = this.dialog.open(EditLocationComponent, {
      width: '400px',
      data: this.selectedLocation,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('Edit location dialog closed:', result);
      if (result === true) {
        console.log('Refreshing organization data');
        this.organizationDataService.clearCache(this.organization.id);
        this.refreshOrganization();
      }
    });
  }

  deleteLocation() {
    if (this.selectedLocation) {
      this.organizationService.deleteLocation(this.selectedLocation).subscribe({
        next: (data) => {
          console.log('Location deleted:', data);

          this.organization.locations = this.organization.locations.filter(
            (location) => location.id !== this.selectedLocation?.id
          );

          this.selectedLocation = null;
          this.organizationDataService.clearCache(this.organization.id);
          this.refreshOrganization();
        },
        error: (err) => {
          console.error('Failed to delete location: ', err);
          if (err.error?.message) {
            console.error(err.error.message);
          }
        },
      });
    }
  }

  sortTable(column: string) {
    if (this.sortColumn = column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    }
    else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredUsers.sort((a, b) => {
      let valueA: string, valueB: string;

      if (column === 'name') {
        valueA = `${a.firstName} ${a.lastName}`.toLowerCase().trim();
        valueB = `${b.firstName} ${b.lastName}`.toLowerCase().trim();
      }
      else {
        valueA = String(a[column as keyof OrgUser] ?? '').toLowerCase().trim();
        valueB = String(b[column as keyof OrgUser] ?? '').toLowerCase().trim();
      }

      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }
}