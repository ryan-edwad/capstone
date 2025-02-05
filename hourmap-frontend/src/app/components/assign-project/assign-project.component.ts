import { Component, EventEmitter, HostListener, Inject, Input, Output } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { OrgUser } from '../../_models/org-user';
import { OrganizationService } from '../../_services/organization.service';
import { Project } from '../../_models/project';

/**
 * Component for assigning users to a project.
 */
@Component({
  selector: 'app-assign-project',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './assign-project.component.html',
  styleUrl: './assign-project.component.css'
})
export class AssignProjectComponent {
  @Input() organizationUsers: OrgUser[] = [];
  @Input() selectedProject!: Project;
  @Output() closeDialog = new EventEmitter<void>();

  assignedUsers: OrgUser[] = [];
  filteredUsers: OrgUser[] = [];
  selectedAssignedUser: OrgUser | null = null;

  constructor(private organizationService: OrganizationService,
    @Inject(MAT_DIALOG_DATA) public data: { project: Project, users: OrgUser[] },
    public dialogRef: MatDialogRef<AssignProjectComponent>) {
    this.selectedProject = data.project;
    this.organizationUsers = data.users;
    this.loadAssignedUsers();

  }

  ngOnInit() {
    if (!this.selectedProject) {
      console.error('No project selected!');
      return;
    }

    this.loadAssignedUsers();

  }

  loadAssignedUsers() {
    console.log(this.selectedProject.id);
    this.organizationService.getAssignedUsers(this.selectedProject.id).subscribe({
      next: (data: OrgUser[]) => {
        this.assignedUsers = data;
        this.filterUsers({ target: { value: '' } });
      },
      error: (err: any) => console.error('Failed to load assigned users:', err)
    });
  }

  filterUsers(event: any) {
    const searchTerm = event.target.value.toLowerCase().trim();
    if (!searchTerm) {
      this.filteredUsers = [];
    }
    else {
      this.filteredUsers = this.organizationUsers
        .filter(user => user.lastName.toLowerCase()
          .includes(searchTerm) || user.firstName.toLowerCase().includes(searchTerm) && !this.assignedUsers
            .some(assignedUser => assignedUser.id === user.id));
    }
  }

  selectUser(user: OrgUser) {
    console.log('Selected User:', user);
    if (!this.assignedUsers.some(assignedUser => assignedUser.id === user.id)) {
      this.assignedUsers.push(user);
      this.filteredUsers = this.filteredUsers.filter(u => u.id !== user.id);
    }
  }

  selectAssignedUser(user: any) {
    console.log('Selected Assigned User:', user);
    this.selectedAssignedUser = user;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const clickedInside = (event.target as HTMLElement).closest('.assigned-users');
    if (!clickedInside) {
      this.clearSelection();
    }
  }

  removeUser(user: any) {
    this.assignedUsers = this.assignedUsers.filter(u => u.id !== user.id);
    if (!this.organizationUsers.some(u => u.id === user.id)) {
      this.filteredUsers.push(user);
    }
  }

  clearSelection() {
    this.selectedAssignedUser = null;
  }

  submit() {
    const userIds = this.assignedUsers.map(user => user.id);
    this.organizationService.updateProjectUsers(this.selectedProject.id, userIds).subscribe({
      next: () => {
        alert('Project users updated successfully!');
        this.dialogRef.close(true);
      },
      error: (err: any) => console.error('Failed to update project users:', err)
    });
  }


  close() {
    this.dialogRef.close(false);
  }
}