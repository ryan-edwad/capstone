import { Component } from '@angular/core';
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

@Component({
  selector: 'app-organization-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './organization-dashboard.component.html',
  styleUrl: './organization-dashboard.component.css'
})
export class OrganizationDashboardComponent {
  organization: Organization = { id: 0, name: 'Default Loaded, Check the Logs', createdAt: new Date(), users: [] };;
  selectedUser: OrgUser | null = null;
  selectedInvitation: Invitation | null = null;
  invitations: Invitation[] = [];

  constructor(private organizationService: OrganizationService, private router: Router, private dialog: MatDialog) { }

  ngOnInit() {
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
      this.router.navigate(['/login']); // Go back to login bro
    }

    this.getOrganization(organizationId);

    this.getInvitations();
  }

  getOrganization(organizationId: number) {
    this.organizationService.getOrganization(organizationId).subscribe({
      next: (data) => {
        this.organization = {
          ...data,
          users: data.users || []
        },
          console.log('Loading organization:', this.organization);
      },
      error: (err) => console.error('Failed to load organization: ', err)
    });

  }

  getInvitations() {
    this.organizationService.getInvitations().subscribe({
      next: (data: Invitation[]) => {
        this.invitations = data;
        console.log('Loaded invitations:', this.invitations);
      },
      error: (err) => {
        console.error('Failed to load invitations:', err)
        if (err.error?.message) { console.error(err.error.message); }
      }
    });
  }


  selectUser(orgUser: OrgUser) {
    this.selectedUser = orgUser;
  }

  selectInvitation(invitation: Invitation) {
    this.selectedInvitation = invitation;
  }

  addUser() {
    const dialogRef = this.dialog.open(AddUserComponent, {
      width: '400px',
      data: { organizationId: this.organization?.id },
      disableClose: true,
      // panelClass: 'custom-dialog-container',
      // backdropClass: 'custom-backdrop'
    });

    dialogRef.afterClosed().subscribe(() => {
      console.log('Add user dialog closed!');
    });
  }

  editUser() {
    if (!this.selectedUser) {
      console.error('No user selected to edit');
      return;
    }

    console.log('Selected user:', this.selectedUser);

    const dialogRef = this.dialog.open(EditUserComponent, {
      width: '400px',
      data: this.selectedUser,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('Edit user dialog closed:', result);
      if (result === true) {
        console.log('Refreshing organization data');
        this.refreshOrganization();
      }
    });
  }

  disableUser() {
    if (this.selectedUser) {
      this.organizationService.disableUser(this.selectedUser.id).subscribe({
        next: (data) => {
          console.log(data);
        },
        error: (err) => console.error('Failed to disable user: ', err)
      });
    }
  }

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

    this.organizationService.getOrganization(organizationId).subscribe({
      next: (data) => {
        this.organization = {
          ...data,
          users: data.users || []
        };
        console.log('Organization data refreshed:', this.organization);
      },
      error: (err) => console.error('Failed to refresh organization data:', err)
    });

  }
}