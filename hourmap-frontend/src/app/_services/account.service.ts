import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { BehaviorSubject, map } from 'rxjs';
import { Router } from '@angular/router';
import { AuthResponse } from '../_models/auth-response';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private http = inject(HttpClient);
  private router = inject(Router);
  baseUrl = `${environment.apiUrl}auth/`;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
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
        if (!response.organizationId) {
          this.router.navigate(['/new-org']);
        } else {
          this.router.navigate(['/time-clock'])
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


  logout() {
    this.removeToken();
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
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

  public isLoggedIn() {
    const token = this.getToken();
    return !!token;
  }

}
