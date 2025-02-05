import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { Project } from '../_models/project';
import { WorkLocation } from '../_models/work-location';
import { TimeclockEntry } from '../_models/timeclock-entry';
import { PayrollObject } from '../_models/payroll-object';
/**
 * Service for handling timeclock related requests to the backend
 */
@Injectable({
  providedIn: 'root'
})
export class TimeclockService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}timeentry`;

  constructor() { }

  /**
   * Get time entries for a specified user and date range
   * @param userId id of the user to get time entries for
   * @param startDate the start date of the range to get time entries for
   * @param endDate the end date of the range to get time entries for
   * @returns A list of time entries for the user within the specified date range
   */
  getTimeEntriesByUserAndDateRange(userId: string, startDate?: Date, endDate?: Date) {
    var timeEntriesUrl = `${this.baseUrl}/entries-by-uid-and-dates/${userId}`;
    if (startDate && endDate) {
      timeEntriesUrl += `?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
    }
    return this.http.get<TimeclockEntry[]>(timeEntriesUrl);

  }

  /**
   * Get an organization's details
   * @param orgId id of the organization to get details for
   * @returns An observable of the organization details
   */
  getOrganizationDetails(orgId: number): Observable<any> {
    var organizationUrl = `${environment.apiUrl}organization/get/${orgId}`;
    return this.http.get(organizationUrl);
  }

  /**
   * Clock In a user
   * @param projectId id of the project to clock in to
   * @param locationId id of the location to clock in to
   * @returns An observable of the timeclock entry created
   */
  clockIn(projectId?: number, locationId?: number): Observable<any> {
    const payload = {
      projectId: projectId || null,
      locationId: locationId || null
    }
    console.log('Payload being sent: ', payload);

    return this.http.post<TimeclockEntry>(`${this.baseUrl}/clock-in/`, payload);
  }

  /**
   * Clock Out a user
   * @param timeEntryId id of an existing time entry to clock out
   * @returns Timeclock entry that was clocked out
   */
  clockOut(timeEntryId: number): Observable<TimeclockEntry> {
    return this.http.put<TimeclockEntry>(`${this.baseUrl}/clock-out/${timeEntryId}`, null);
  }

  /**
   * Used to get the most recent timeclock entry for the user
   * @returns The most recent timeclock entry for the user
   */
  getRecentEntry(): Observable<TimeclockEntry> {
    return this.http.get<TimeclockEntry>(`${this.baseUrl}/recent-entry`);
  }

  /**
   * Get all work locations for an organization
   * @returns A list of all work locations
   */
  getLocations(): Observable<WorkLocation[]> {
    return this.http.get<WorkLocation[]>(`${environment.apiUrl}location/all-locations`);
  }

  /**
   * Get all projects for the CURRENTLY SIGNED IN user
   * @returns A list of all projects assigned to a signed in user
   */
  getProjectsByUser(): Observable<Project[]> {
    return this.http.get<Project[]>(`${environment.apiUrl}project/get-projects-by-user`);
  }

  /**
   * Get all projects for ANY user within the same org, by ID
   * @param userId user id to get projects for
   * @returns Observable of a list of projects assigned to the user
   */
  getProjectsByUserId(userId: string): Observable<Project[]> {
    return this.http.get<Project[]>(`${environment.apiUrl}project/get-projects-by-uid/${userId}`);
  }

  /**
   * Get all time entries for a currently signed in user within a date range
   * @param startDate start date of the range
   * @param endDate end date of the range
   * @returns Observable of a list of time entries for the user within the date range
   */
  getTimeEntriesByDates(startDate: string, endDate: string): Observable<TimeclockEntry[]> {
    return this.http.get<TimeclockEntry[]>(`${this.baseUrl}/get-user-entries-by-dates?startDate=${startDate}&endDate=${endDate}`);
  }

  /**
   * Gets a payroll report for a specified date range, includes user details, hours worked, and pay
   * @param startDate start date of the range
   * @param endDate end date of the range
   * @returns Observable of a list of payroll objects
   */
  getPayrollReport(startDate: string, endDate: string): Observable<PayrollObject[]> {
    return this.http.get<PayrollObject[]>(`${this.baseUrl}/payroll-report?startDate=${startDate}&endDate=${endDate}`);
  }

  /**
   * Gets a report for a specific project, and hours worked.
   * @param projectId id of the project to get a report for
   * @param startDate start date of the range
   * @param endDate end date of the range
   * @returns PayrollObject list of hours worked on the project
   */
  getProjectReport(projectId: number, startDate: string, endDate: string) {
    const url = `${this.baseUrl}/project-report/${projectId}?startDate=${startDate}&endDate=${endDate}`;
    return this.http.get<PayrollObject[]>(url);
  }

  /**
   * Edits a time entry
   * @param updatedEntry the existing time entry with updated values 
   * @returns a time entry with the updated values
   */
  updateTimeEntry(updatedEntry: TimeclockEntry) {
    return this.http.put<TimeclockEntry>(`${this.baseUrl}/update`, updatedEntry);
  }


}
