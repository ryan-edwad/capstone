import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { OrganizationService } from '../../_services/organization.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountService } from '../../_services/account.service';
import { OrgUser } from '../../_models/org-user';
import { CommonModule } from '@angular/common';
import { TreasurePathBackgroundComponent } from "../treasure-path-background/treasure-path-background.component";

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule, TreasurePathBackgroundComponent],
  templateUrl: './edit-profile.component.html',
  styleUrl: './edit-profile.component.css'
})
export class EditProfileComponent implements OnInit {
  editUserForm!: FormGroup;
  userId: string = '';
  isManagerOrAdmin: boolean = false;
  originalUserData!: Partial<OrgUser>;

  constructor(
    private fb: FormBuilder,
    private accountService: AccountService,
    private organizationService: OrganizationService,
    private route: ActivatedRoute,
    public router: Router
  ) { }

  ngOnInit() {
    this.loadUserFromToken();
    this.initializeForm();
  }

  private initializeForm() {
    this.editUserForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    });
  }

  loadUserFromToken() {
    const token = this.accountService.getTokenDecoded();
    if (!token) {
      this.isManagerOrAdmin = false;
      return;
    }
    const schema = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
    this.isManagerOrAdmin = token ? ['Manager', 'Admin'].includes(token[schema]) : false;
    this.userId = token['sub'];

    this.organizationService.getUser(this.userId).subscribe({
      next: (user: OrgUser) => {
        this.originalUserData = {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        };

        this.editUserForm.patchValue(this.originalUserData);
      },
      error: (error) => {
        console.log(error);
      }
    })

  }

  isFormUnchanged(): boolean {
    const currentValues = this.editUserForm.getRawValue();
    return JSON.stringify(this.originalUserData) === JSON.stringify(currentValues);
  }

  onSubmit() {
    if (this.editUserForm.invalid) {
      return;
    }

    const updatedUser = this.editUserForm.value;
    console.log(updatedUser);
    updatedUser.id = this.userId;

    this.organizationService.updateUserProfile(this.userId, updatedUser).subscribe({
      next: (response) => {
        console.log(response.message);
        this.accountService.refreshToken(response.token);
        this.router.navigate(['timeclock']);
      },
      error: (err) => console.error('Error updating user or token: ', err)
    });
  }



}
