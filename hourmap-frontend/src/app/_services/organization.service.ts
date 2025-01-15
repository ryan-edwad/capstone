import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { Organization } from '../_models/organization';
import { Invitation } from '../_models/invitation';
import { Project } from '../_models/project';
import { CreateProject } from '../_models/create-project';
import { WorkLocation } from '../_models/work-location';
import { OrgUser } from '../_models/org-user';

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}organization`;

  constructor() {
  }

  getUsers() {
    var usersUrl = `${environment.apiUrl}user`;
    return this.http.get(usersUrl);
  }

  getInvitations() {
    var invitationsUrl = `${environment.apiUrl}invitation/invitations`;
    return this.http.get<Invitation[]>(`${invitationsUrl}`);
  }

  deleteInvitation(invitationId: number) {
    var deleteUrl = `${environment.apiUrl}invitation/cancel/${invitationId}`;
    return this.http.delete<{ message: string }>(deleteUrl);
  }

  getUser(userId: string) {
    var userUrl = `${environment.apiUrl}user/${userId}`;
    return this.http.get(userUrl);
  }

  updateUser(userId: string, editUser: { firstName: string, lastName: string, email: string, jobTitle: string, payRate: number }) {
    var userUrl = `${environment.apiUrl}user/edit-by-manager/${userId}`;
    return this.http.put<{ message: string }>(userUrl, editUser);
  }

  createOrganization(organization: { name: string }) {
    return this.http.post<{ message: string }>(`${this.baseUrl}/create`, organization);
  }

  getOrganization(id: number) {
    return this.http.get<Organization>(`${this.baseUrl}/get/${id}`);
  }

  inviteUser(inviteUser: { email: string, organizationId: number }) {
    var inviteUrl = `${environment.apiUrl}invitation`
    return this.http.post<{ registrationLink: string }>(`${inviteUrl}/invite`, inviteUser);

  }

  disableUser(userId: string) {
    var disableUrl = `${environment.apiUrl}user/disable-sign-in/${userId}`;
    return this.http.put<{ message: string }>(disableUrl, {});

  }

  enableUser(userId: string) {
    var enableUrl = `${environment.apiUrl}user/enable-sign-in/${userId}`;
    return this.http.put<{ message: string }>(enableUrl, {});
  }

  addProject(project: CreateProject) {
    var addProjectUrl = `${environment.apiUrl}project/create`;
    return this.http.post<{ message: string }>(addProjectUrl, project);

  }

  getProjects() {
    var projectsUrl = `${environment.apiUrl}project/get-projects`;
    return this.http.get<Project[]>(projectsUrl);
  }

  getProject(id: number) {
    var projectUrl = `${environment.apiUrl}project/${id}`;
    return this.http.get<Project>(projectUrl);
  }

  updateProject(project: Project) {
    var projectUrl = `${environment.apiUrl}project/update`;
    return this.http.put<{ message: string }>(projectUrl, project);
  }

  addLocation(location: WorkLocation) {
    var addLocationUrl = `${environment.apiUrl}location/create`;
    return this.http.post<{ message: string }>(addLocationUrl, location);

  }

  getAssignedUsers(projectId: number) {
    var assignedUsersUrl = `${environment.apiUrl}project/${projectId}/assigned-users`;
    return this.http.get<OrgUser[]>(assignedUsersUrl);
  }

  updateProjectUsers(projectId: number, userIds: string[]) {
    var updateUrl = `${environment.apiUrl}project/${projectId}/update-users`;
    return this.http.post<{ message: string }>(updateUrl, userIds);
  }

}
