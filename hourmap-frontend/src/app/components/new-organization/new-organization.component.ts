import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OrganizationService } from '../../_services/organization.service';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { AccountService } from '../../_services/account.service';
/**
 * New organization component
 */
@Component({
  selector: 'app-new-organization',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './new-organization.component.html',
  styleUrl: './new-organization.component.css'
})
export class NewOrganizationComponent {
  createOrgForm: FormGroup;
  accountService = inject(AccountService);

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
        this.accountService.refreshToken(response.token);
        this.router.navigate(['organization-dashboard'])
      },
      error: (err) => {
        console.error('Failed to create organization:', err);
      }
    });
  }

}
