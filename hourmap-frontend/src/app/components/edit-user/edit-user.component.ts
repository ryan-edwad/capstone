import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OrganizationService } from '../../_services/organization.service';
import { CommonModule } from '@angular/common';
import { OrgUser } from '../../_models/org-user';

@Component({
  selector: 'app-edit-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-user.component.html',
  styleUrl: './edit-user.component.css'
})
export class EditUserComponent {
  editUserForm!: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<EditUserComponent>,
    private fb: FormBuilder,
    private organizationService:

      OrganizationService,
    @Inject(MAT_DIALOG_DATA) public user: OrgUser
  ) {
    console.log('Data passed to EditUserComponent:', user);
    if (!user) {
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
    this.editUserForm.patchValue(user);
    console.log('Form initialized with user data:', this.editUserForm.value);
  }

  submit() {
    if (this.editUserForm.invalid) return;

    const editUser = this.editUserForm.value;
    console.log('Submitting edited user:', editUser);
    const userId = this.user.id;
    console.log('User ID:', userId);
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
