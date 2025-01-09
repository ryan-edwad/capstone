import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AccountService } from '../../_services/account.service';
import { RegisterInviteUser } from '../../_models/register-invite-user';

@Component({
  selector: 'app-login-register',
  standalone: true,
  imports: [HttpClientModule, ReactiveFormsModule, CommonModule, RouterModule],
  providers: [AccountService],
  templateUrl: './login-register.component.html',
  styleUrl: './login-register.component.css'
})
export class LoginRegisterComponent {
  authForm: FormGroup;
  isLoginMode: boolean = true;
  token: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private accountService: AccountService,
  ) {
    this.authForm = this.fb.group({
      email: [{ value: '', disabled: false }, [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: [''], // For use with registration
      firstName: [''], // For use with registration
      lastName: [''] // for use with registration
    });


    this.route.url.subscribe((url) => {
      this.isLoginMode = url[0].path === 'login';
      this.updateConfirmPasswordValidator();
      this.updateConfirmFirstLastNameValidator();
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || null;
      if (this.token) {
        console.log('Invitation token! Welcome to the team!', this.token);
        this.isLoginMode = false;
        this.authForm.get('email')?.disable();
        this.updateConfirmPasswordValidator();
        this.updateConfirmFirstLastNameValidator();
      }
    })
  }

  updateConfirmPasswordValidator() {
    const confirmPasswordControl = this.authForm.get('confirmPassword');
    if (this.isLoginMode) {
      confirmPasswordControl?.clearValidators();
    } else {
      confirmPasswordControl?.setValidators([Validators.required, Validators.minLength(8)]);
    }
    confirmPasswordControl?.updateValueAndValidity();
  }

  updateConfirmFirstLastNameValidator() {
    const confirmFirstNameControl = this.authForm.get('firstName');
    const confirmLastNameControl = this.authForm.get('lastName');
    if (this.isLoginMode) {
      confirmFirstNameControl?.clearValidators();
      confirmLastNameControl?.clearValidators();
    }
    else {
      confirmFirstNameControl?.setValidators([Validators.required]);
      confirmLastNameControl?.setValidators([Validators.required]);
    }
    confirmFirstNameControl?.updateValueAndValidity();
    confirmLastNameControl?.updateValueAndValidity();
  }

  onSubmit() {
    if (this.authForm.invalid) return;

    const { password, confirmPassword, lastName, firstName } = this.authForm.value;

    if (this.token) {
      if (!this.isLoginMode && password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
      }
      const registerInviteUser: RegisterInviteUser = {
        password,
        firstName,
        lastName,
        token: this.token
      };

      this.accountService.registerWithToken(registerInviteUser);
    }
    else if (this.isLoginMode) {
      const { email } = this.authForm.value;
      this.accountService.login({ email, password });
    }
    else {
      if (!this.isLoginMode && password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
      }
      const { email } = this.authForm.value;
      this.accountService.register({ email, password, firstName, lastName });
    }


  }
}
