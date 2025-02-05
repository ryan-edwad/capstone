import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { BehaviorSubject, map } from 'rxjs';
import { Router } from '@angular/router';
import { AuthResponse } from '../_models/auth-response';
import { RegisterInviteUser } from '../_models/register-invite-user';
/**
 * Service for user account management and authentication/authorization.
 */
@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private http = inject(HttpClient);
  private router = inject(Router);
  baseUrl = `${environment.apiUrl}auth/`;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.isLoggedIn());
  public isAuthenticated = this.isAuthenticatedSubject.asObservable();
  private currentUserIdSubject = new BehaviorSubject<string | null>(null);
  public currentUserId$ = this.currentUserIdSubject.asObservable();

  constructor() {
    this.loadUserIdFromToken();
  }

  /**
   * Load the user ID from the token and emit it to the currentUserIdSubject.
   */
  private loadUserIdFromToken() {
    const tokenData = this.getTokenDecoded();
    const userId = tokenData?.sub || null;
    this.currentUserIdSubject.next(userId);
  }


  /**
   * Login the user and save the token to local storage.
   * @param user the authentication credentials
   * @returns AuthResponse the response from the server
   */
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
        this.loadUserIdFromToken();
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
        alert('Login failed. ' + err.error.message);
      },
    });
  }

  /**
   * Refresh the token.
   * @param token the token to be refreshed
   * @returns new token
   */
  refreshToken(token: string) {
    if (!token) {
      console.error('No token found for refresh.');
      return;
    }
    console.log('Token to be refreshed:', token);
    this.saveToken(token);
  }

  /**
   * Register a new user.
   * @param registerUser The information of the user to be registered
   * @returns Response message from the server
   */
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

  /**
   * Register as an invited user with a token.
   * @param registerInviteUser The information of the user to be registered
   * @returns Response message from the server
   */
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

  /**
   * Logout the user and remove the token from local storage.
   */
  logout() {
    this.removeToken();
    this.currentUserIdSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * Save the token to local storage.
   * @param token the token to save
   */
  private saveToken(token: string) {
    console.log('Saving token:', token);
    localStorage.setItem('authToken', token);
    this.loadUserIdFromToken();
  }

  /**
   * Remove the token from local storage.
   */
  private removeToken() {
    localStorage.removeItem('authToken');
  }

  /**
   * Retrieve the token from local storage.
   * @returns the token
   */
  public getToken() {
    return localStorage.getItem('authToken');
  }

  /**
   * Gets a decoded token for authorization
   * @returns A parsed token
   */
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

  /**
   * Check if the user is logged in.
   * @returns Whether the user is logged in or not
   */
  public isLoggedIn() {
    const token = this.getToken();
    console.log('Initial Auth State:', token ? true : false); // remove this shit
    return !!token;
  }

}
