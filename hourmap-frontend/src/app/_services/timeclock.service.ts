import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { Project } from '../_models/project';
import { WorkLocation } from '../_models/work-location';
import { TimeclockEntry } from '../_models/timeclock-entry';
import { PayrollObject } from '../_models/payroll-object';

@Injectable({
  providedIn: 'root'
})
export class TimeclockService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}timeentry`;

  constructor() { }

  getTimeEntriesByUserAndDateRange(userId: string, startDate?: Date, endDate?: Date) {
    var timeEntriesUrl = `${this.baseUrl}/entries-by-uid-and-dates/${userId}`;
    if (startDate && endDate) {
      timeEntriesUrl += `?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
    }
    return this.http.get<TimeclockEntry[]>(timeEntriesUrl);

  }

  getOrganizationDetails(orgId: number): Observable<any> {
    var organizationUrl = `${environment.apiUrl}organization/get/${orgId}`;
    return this.http.get(organizationUrl);
  }

  clockIn(project?: Project, location?: WorkLocation): Observable<TimeclockEntry> {
    const params: any = {};
    if (project) params.projectId = project.id;
    if (location) params.locationId = location.id;

    return this.http.post<TimeclockEntry>(`${this.baseUrl}/clock-in/`, { params });
  }

  clockOut(timeEntryId: number): Observable<TimeclockEntry> {
    return this.http.put<TimeclockEntry>(`${this.baseUrl}/clock-out/${timeEntryId}`, null);
  }

  getRecentEntry(): Observable<TimeclockEntry> {
    return this.http.get<TimeclockEntry>(`${this.baseUrl}/recent-entry`);
  }

  getLocations(): Observable<WorkLocation[]> {
    return this.http.get<WorkLocation[]>(`${environment.apiUrl}location/all-locations`);
  }

  getProjectsByUser(): Observable<Project[]> {
    return this.http.get<Project[]>(`${environment.apiUrl}project/get-projects-by-user`);
  }

  getTimeEntriesByDates(startDate: string, endDate: string): Observable<TimeclockEntry[]> {
    return this.http.get<TimeclockEntry[]>(`${this.baseUrl}/get-user-entries-by-dates?startDate=${startDate}&endDate=${endDate}`);
  }

  getPayrollReport(startDate: string, endDate: string): Observable<PayrollObject[]> {
    return this.http.get<PayrollObject[]>(`${this.baseUrl}/payroll-report?startDate=${startDate}&endDate=${endDate}`);
  }

  getProjectReport(projectId: number, startDate: string, endDate: string) {
    const url = `${this.baseUrl}/project-report/${projectId}?startDate=${startDate}&endDate=${endDate}`;
    return this.http.get<PayrollObject[]>(url);
  }


}
