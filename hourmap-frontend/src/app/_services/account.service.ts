import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { BehaviorSubject, map } from 'rxjs';
import { Router } from '@angular/router';
import { AuthResponse } from '../_models/auth-response';
import { RegisterInviteUser } from '../_models/register-invite-user';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private http = inject(HttpClient);
  private router = inject(Router);
  baseUrl = `${environment.apiUrl}auth/`;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.isLoggedIn());
  public isAuthenticated = this.isAuthenticatedSubject.asObservable();



  login(user: { email: string, password: string }) {
    return this.http.post<AuthResponse>(`${this.baseUrl}login`, user).subscribe({
      next: (response) => {
        this.saveToken(response.token);
        console.log('User Info:', {
          userId: response.userId,
          email: response.email,
          organizationId: response.organizationId,
          roles: response.roles
        });
        this.isAuthenticatedSubject.next(true);
        console.log('isAuthenticatedSubject emitted:', true);
        if (!response.organizationId) {
          console.log('Navigating to create organization... ');
          this.router.navigate(['/create-organization']);
        } else {
          if (response.roles.includes('Manager')) {
            console.log('Navigating to Organization Dashboard...');
            this.router.navigate(['/organization-dashboard']);
          }
          else {
            this.router.navigate(['/timeclock']);
          }
        }
      },
      error: (err) => {
        console.error('Login error:', err);
        alert('Failed to log in. Please check your credentials and try again.');
      },
    });
  }

  register(registerUser: { email: string, password: string, lastName?: string, firstName?: string }) {
    return this.http
      .post<{ message: string }>(this.baseUrl + 'register', registerUser)
      .subscribe({
        next: (response) => {
          console.log('Registration successful:', response);
          this.router.navigate(['/login']);
        },
        error: (err) => {
          console.error('Registration error:', err);
        }
      });
  }

  registerWithToken(registerInviteUser: RegisterInviteUser) {
    const url = `${this.baseUrl}register/invite/`;
    return this.http
      .post<{ message: string }>(url, registerInviteUser)
      .subscribe({
        next: (response) => {
          console.log('Registration with token successful:', response);
          this.router.navigate(['/login']);
        },
        error: (err) => {
          console.error('Registration with token error:', err);
        }
      });
  }

  logout() {
    this.removeToken();
    this.isAuthenticatedSubject.next(false);
  }

  private saveToken(token: string) {
    localStorage.setItem('authToken', token);
  }

  private removeToken() {
    localStorage.removeItem('authToken');
  }

  public getToken() {
    return localStorage.getItem('authToken');
  }

  public getTokenDecoded() {
    const token = this.getToken();
    if (!token) {
      console.log('No token found');
      return null;
    }
    try {
      const payload = token.split('.')[1];
      const decoded = window.atob(payload);
      return JSON.parse(decoded);
    }
    catch (e) {
      console.error('Failed to decode token', e);
      return null;
    }

  }

  public isLoggedIn() {
    const token = this.getToken();
    console.log('Initial Auth State:', token ? true : false); // remove this shit
    return !!token;
  }

}
