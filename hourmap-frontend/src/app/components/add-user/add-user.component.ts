import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OrganizationService } from '../../_services/organization.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-user.component.html',
  styleUrl: './add-user.component.css'
})
export class AddUserComponent {
  addUserForm: FormGroup;
  invitationLink: string | null = null;

  constructor(
    private dialogRef: MatDialogRef<AddUserComponent>,
    private fb: FormBuilder,
    private organizationService: OrganizationService,
    @Inject(MAT_DIALOG_DATA) public data: { organizationId: number }
  ) {
    this.addUserForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  submit() {
    if (this.addUserForm.invalid) return;

    const email = this.addUserForm.value.email;
    var organizationUser = { email, organizationId: this.data.organizationId };
    this.organizationService.inviteUser(organizationUser).subscribe({
      next: (response) => {
        console.log('Response from API:', response); // Log API response
        this.invitationLink = response.registrationLink;
      },
      error: (err) => {
        console.error('Failed to generate invitation link:', err);
        if (err.error?.message) {
          alert(err.error.message); // Display error message to the user
        } else {
          alert('An unexpected error occurred. Please try again.');
        }
      }
    });
  }

  close() {
    this.dialogRef.close();
  }

  copyLink() {
    if (this.invitationLink) {
      navigator.clipboard.writeText(this.invitationLink);
      alert('Link copied to clipboard!');
    }
  }
}
