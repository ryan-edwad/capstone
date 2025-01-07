import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}organization`;

  constructor() {
    console.log('OrganizationService intialized') // TODO remove after debug
  }

  createOrganization(organization: { name: string }) {
    return this.http.post<{ message: string }>(`${this.baseUrl}/create`, organization);
  }
}
