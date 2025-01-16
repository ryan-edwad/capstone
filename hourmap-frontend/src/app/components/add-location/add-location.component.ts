import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { OrganizationService } from '../../_services/organization.service';

@Component({
  selector: 'app-add-location',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-location.component.html',
  styleUrl: './add-location.component.css'
})
export class AddLocationComponent {
  addLocationForm: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<AddLocationComponent>,
    private fb: FormBuilder,
    private organizationService: OrganizationService,
    @Inject(MAT_DIALOG_DATA) public data: { organizationId: number }
  ) {
    this.addLocationForm = this.fb.group({
      name: ['', [Validators.required]],
      address: [''],
      city: [''],
      state: [''],
      description: ['']
    });
  }

  submit() {
    if (this.addLocationForm.invalid) return;

    const location = this.addLocationForm.value;
    location.organizationId = this.data.organizationId;
    this.organizationService.addLocation(location).subscribe({
      next: (response) => {
        console.log('Response from API:', response);
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Failed to add location:', err);
        if (err.error?.message) {
          alert(err.error.message); // Display error message to the user
        } else {
          alert('An unexpected error occurred. Please try again.');
        }
      }
    });
  }

  close() {
    this.dialogRef.close(true);

  }

}
