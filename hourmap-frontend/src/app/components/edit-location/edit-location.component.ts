import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { OrganizationService } from '../../_services/organization.service';
import { WorkLocation } from '../../_models/work-location';
/**
 * Component for editing a location in an organization.
 */
@Component({
  selector: 'app-edit-location',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-location.component.html',
  styleUrl: './edit-location.component.css'
})
export class EditLocationComponent {
  editLocationForm!: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<EditLocationComponent>,
    private fb: FormBuilder,
    private organizationService: OrganizationService,
    @Inject(MAT_DIALOG_DATA) public workLocation: WorkLocation) {
    console.log('Data passed to EditLocationComponent:', workLocation);
    if (!workLocation) {
      console.error('No work location data provided to the dialog');
      return;
    }
    // Initialize the form with empty values
    this.editLocationForm = this.fb.group({
      name: [workLocation.name, [Validators.required]],
      description: [workLocation.description ?? ''],
      address: [workLocation.address ?? ''],
      city: [workLocation.city ?? ''],
      state: [workLocation.state ?? '']
    });

    // Patch the form values with the project's data
    this.editLocationForm.patchValue(workLocation);
    console.log('Form initialized with project data:', this.editLocationForm.value);
  }

  submit() {
    if (this.editLocationForm.invalid) return;

    const editLocation = this.editLocationForm.value;
    editLocation.Id = this.workLocation.id;
    console.log('Submitting edited project:', editLocation);
    this.organizationService.updateLocation(editLocation).subscribe({
      next: (response) => {
        console.log('Response from API:', response);
        alert('Location updated successfully!');
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Failed to update location:', err);
        alert('Failed to update location');
      }
    });
  }

  close() {
    console.log('Closing dialog');
    this.dialogRef.close(false);
  }
}
