import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { OrganizationService } from '../../_services/organization.service';
import { CommonModule } from '@angular/common';
import { OrgUser } from '../../_models/org-user';
import { Project } from '../../_models/project';

@Component({
  selector: 'app-edit-user',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './edit-user.component.html',
  styleUrl: './edit-user.component.css'
})
export class EditUserComponent {
  editUserForm!: FormGroup;
  assignedProjects: Project[] = [];
  availableProjects: Project[] = [];
  selectedProject: Project | null = null;

  constructor(
    private dialogRef: MatDialogRef<EditUserComponent>,
    private fb: FormBuilder,
    private organizationService:

      OrganizationService,
    @Inject(MAT_DIALOG_DATA) public data: { user: OrgUser, availableProjects: Project[] }
  ) {
    console.log('Data passed to EditUserComponent:', data);
    if (!data) {
      console.error('No user data provided to the dialog');
      return;
    }

    // Initialize the form with empty values
    this.editUserForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      jobTitle: ['', Validators.required],
      payRate: [0]
    });

    // Patch the form values with the user's data
    this.editUserForm.patchValue(data.user);
    console.log('Form initialized with user data:', this.editUserForm.value);
  }

  submit() {
    if (this.editUserForm.invalid) return;

    const editUser = { ...this.editUserForm.value, projects: this.assignedProjects };
    console.log('Submitting edited user:', editUser);

    // LOOK HERE NOW!!
    var userId = this.data.user.id;

    this.organizationService.updateUser(userId, editUser).subscribe({
      next: (response) => {
        console.log('Response from API:', response);
        alert('User updated successfully!');
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Failed to update user:', err);
        if (err.error?.message) {
          alert(err.error.message);
        } else {
          alert('An unexpected error occurred. Please try again.');
        }
      }
    });
  }

  close() {
    console.log('Closing dialog');
    this.dialogRef.close();
  }

}
