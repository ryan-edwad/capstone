import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { OrganizationService } from '../../_services/organization.service';
import { Project } from '../../_models/project';

@Component({
  selector: 'app-edit-project',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-project.component.html',
  styleUrl: './edit-project.component.css'
})
export class EditProjectComponent {
  editProjectForm!: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<EditProjectComponent>,
    private fb: FormBuilder,
    private organizationService: OrganizationService,
    @Inject(MAT_DIALOG_DATA) public project: Project
  ) {
    console.log('Data passed to EditProjectComponent:', project);
    if (!project) {
      console.error('No project data provided to the dialog');
      return;
    }

    // Initialize the form with empty values
    this.editProjectForm = this.fb.group({
      name: [project.name, [Validators.required]],
      description: [project.description, Validators.required],
      enabled: [project.enabled]
    });

    // Patch the form values with the project's data
    this.editProjectForm.patchValue(project);
    console.log('Form initialized with project data:', this.editProjectForm.value);
  }

  submit() {
    if (this.editProjectForm.invalid) return;

    const editProject = this.editProjectForm.value;
    console.log('Submitting edited project:', editProject);
    this.organizationService.updateProject(editProject).subscribe({
      next: (response) => {
        console.log('Response from API:', response);
        alert('Project updated successfully!');
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Failed to update project:', err);
        alert('Failed to update project');
      }
    });
  }

  close() {
    console.log('Closing dialog');
    this.dialogRef.close(false);
  }

}
