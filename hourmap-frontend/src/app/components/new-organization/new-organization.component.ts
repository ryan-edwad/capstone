import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OrganizationService } from '../../_services/organization.service';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-new-organization',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './new-organization.component.html',
  styleUrl: './new-organization.component.css'
})
export class NewOrganizationComponent {
  createOrgForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private orgService: OrganizationService,
    private router: Router
  ) {
    this.createOrgForm = fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  onSubmit() {
    if (this.createOrgForm.invalid) return;
    const { name } = this.createOrgForm.value;
    this.orgService.createOrganization({ name }).subscribe({
      next: (response) => {
        console.log('Organization created successfully: ', response);
        this.router.navigate(['users'])
      },
      error: (err) => {
        console.error('Failed to create organization:', err);
      }
    });
  }

}
