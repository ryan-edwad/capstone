import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OrganizationService } from '../../_services/organization.service';
import { CommonModule } from '@angular/common';
import { CreateProject } from '../../_models/create-project';

@Component({
  selector: 'app-new-project',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './new-project.component.html',
  styleUrl: './new-project.component.css'
})
export class NewProjectComponent {
  addProjectForm: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<NewProjectComponent>,
    private fb: FormBuilder,
    private organizationService: OrganizationService,
    @Inject(MAT_DIALOG_DATA) public data: { organizationId: number }
  ) {
    this.addProjectForm = this.fb.group({
      name: ['', [Validators.required]],
      description: ['', [Validators.required]]
    });
  }

  submit() {
    if (this.addProjectForm.invalid) return;

    const name = this.addProjectForm.value.name;
    const description = this.addProjectForm.value.description;
    const organizationId = this.data.organizationId;

    var project: CreateProject = { name, description, organizationId, enabled: true };

    this.organizationService.addProject(project).subscribe({
      next: (response) => {
        console.log('Response from API:', response);
        this.dialogRef.close();
        return true;
      },
      error: (err) => {
        console.error('Failed to create project:', err);
        if (err.error?.message) {
          alert(err.error.message);
        }
        else {
          alert('An unexpected error occurred. Please try again.');
        }
      }
    })
  }

  close() {
    this.dialogRef.close();
    return false;
  }

}
