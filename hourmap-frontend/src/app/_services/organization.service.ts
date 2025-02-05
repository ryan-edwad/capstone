import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { Organization } from '../_models/organization';
import { Invitation } from '../_models/invitation';
import { Project } from '../_models/project';
import { CreateProject } from '../_models/create-project';
import { WorkLocation } from '../_models/work-location';
import { OrgUser } from '../_models/org-user';
import { Observable } from 'rxjs';
/**
 * Service for handling organization related requests to the backend
 */
@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}organization`;

  constructor() {
  }

  /**
   * Gets all users in the organization
   * @returns a list of OrgUser objects from the organization
   */
  getUsers() {
    var usersUrl = `${environment.apiUrl}user`;
    return this.http.get<OrgUser[]>(usersUrl);
  }

  /**
   * Gets all invitations in the organization
   * @returns a list of all invitations in the organization
   */
  getInvitations() {
    var invitationsUrl = `${environment.apiUrl}invitation/invitations`;
    return this.http.get<Invitation[]>(`${invitationsUrl}`);
  }

  /**
   * Deletes an invitation
   * @param invitationId the id of the invitation to delete
   * @returns confirmation message
   */
  deleteInvitation(invitationId: number) {
    var deleteUrl = `${environment.apiUrl}invitation/cancel/${invitationId}`;
    return this.http.delete<{ message: string }>(deleteUrl);
  }

  /**
   * Gets a specific user by their id
   * @param userId the id of the user to get
   * @returns a single OrgUser object
   */
  getUser(userId: string): Observable<OrgUser> {
    var userUrl = `${environment.apiUrl}user/${userId}`;
    return this.http.get<OrgUser>(userUrl);
  }

  /**
   * Updates a user's information, edit by manager only
   * @param userId the id of the user to update
   * @param editUser information to update
   * @returns confirmation message
   */
  updateUser(userId: string, editUser: { firstName: string, lastName: string, email: string, jobTitle: string, payRate: number }) {
    var userUrl = `${environment.apiUrl}user/edit-by-manager/${userId}`;
    return this.http.put<{ message: string }>(userUrl, editUser);
  }

  /**
   * Updates a user's profile, edit by that user
   * @param userId id of the user to update
   * @param editUser information to update
   * @returns confirmation message, new token to be stored by browser to update user's session
   */
  updateUserProfile(userId: string, editUser: { firstName: string, lastName: string, email: string }) {
    var userUrl = `${environment.apiUrl}user/edit-my-profile/${userId}`;
    return this.http.put<{ message: string; token: string }>(userUrl, editUser);
  }

  /**
   * Creates a new organization
   * @param organization The organization to create
   * @returns confirmation message
   */
  createOrganization(organization: { name: string }) {
    return this.http.post<{ message: string, token: string }>(`${this.baseUrl}/create`, organization);
  }

  /**
   * Gets an organization by its id
   * @param id the id of the organization to get
   * @returns the organization object
   */
  getOrganization(id: number) {
    return this.http.get<Organization>(`${this.baseUrl}/get/${id}`);
  }

  /**
   * Creates an invitation to join an organization
   * @param inviteUser the invitee email and the organization id to invite to
   * @returns a registration link for the invitee
   */
  inviteUser(inviteUser: { email: string, organizationId: number }) {
    var inviteUrl = `${environment.apiUrl}invitation`
    return this.http.post<{ registrationLink: string }>(`${inviteUrl}/invite`, inviteUser);

  }

  /**
   * Disables a user's ability to sign in
   * @param userId the id of the user to disable
   * @returns confirmation message
   */
  disableUser(userId: string) {
    var disableUrl = `${environment.apiUrl}user/disable-sign-in/${userId}`;
    return this.http.put<{ message: string }>(disableUrl, {});

  }

  /**
   * Enables a user's ability to sign in
   * @param userId the id of the user to enable
   * @returns confirmation message
   */
  enableUser(userId: string) {
    var enableUrl = `${environment.apiUrl}user/enable-sign-in/${userId}`;
    return this.http.put<{ message: string }>(enableUrl, {});
  }


  /**
   * Adds a project to the organization
   * @param project the project to add
   * @returns confirmation message
   */
  addProject(project: CreateProject) {
    var addProjectUrl = `${environment.apiUrl}project/create`;
    return this.http.post<{ message: string }>(addProjectUrl, project);

  }

  /**
   * Gets all projects in the organization
   * @returns a list of all projects in the organization
   */
  getProjects() {
    var projectsUrl = `${environment.apiUrl}project/get-projects`;
    return this.http.get<Project[]>(projectsUrl);
  }

  /**
   * Gets a specific project by its id
   * @param id the id of the project to get
   * @returns the project object
   */
  getProject(id: number) {
    var projectUrl = `${environment.apiUrl}project/${id}`;
    return this.http.get<Project>(projectUrl);
  }

  /**
   * Updates an existing project
   * @param project the project to update
   * @returns confirmation message
   */
  updateProject(project: Project) {
    var projectUrl = `${environment.apiUrl}project/update`;
    return this.http.put<{ message: string }>(projectUrl, project);
  }

  /**
   * Adds a location to the organization
   * @param location the location to add
   * @returns confirmation message
   */
  addLocation(location: WorkLocation) {
    var addLocationUrl = `${environment.apiUrl}location/create`;
    return this.http.post<{ message: string }>(addLocationUrl, location);

  }

  /**
   * Updates an existing location
   * @param location the location to update
   * @returns confirmation message
   */
  updateLocation(location: WorkLocation) {
    var locationUrl = `${environment.apiUrl}location/update`;
    return this.http.put<{ message: string }>(locationUrl, location);
  }

  /**
   * Deletes a location
   * @param location the location to delete
   * @returns confirmation message
   */
  deleteLocation(location: WorkLocation) {
    var deleteLocationUrl = `${environment.apiUrl}location/delete/${location.id}`;
    return this.http.delete<{ message: string }>(deleteLocationUrl);
  }

  /**
   * Get users asssigned to an organization project
   * @param projectId the id of the project to get assigned users for
   * @returns A list of OrgUser objects assigned to the project
   */
  getAssignedUsers(projectId: number) {
    var assignedUsersUrl = `${environment.apiUrl}project/${projectId}/assigned-users`;
    return this.http.get<OrgUser[]>(assignedUsersUrl);
  }

  /**
   * Update users assigned to a project
   * @param projectId the id of the project to update users for
   * @param userIds the list of user ids to assign to the project
   * @returns confirmation message
   */
  updateProjectUsers(projectId: number, userIds: string[]) {
    var updateUrl = `${environment.apiUrl}project/${projectId}/update-users`;
    return this.http.post<{ message: string }>(updateUrl, userIds);
  }

  /**
   * Promotion of a user to manager role
   * @param userId the user id to promote
   * @returns confirmation message
   */
  promoteUser(userId: string) {
    var promoteUrl = `${environment.apiUrl}user/add-manager-role/${userId}`;
    return this.http.post<{ message: string }>(promoteUrl, {});
  }

  /**
   * Demotion of a user from manager role
   * @param userId the user id to demote
   * @returns confirmation message
   */
  demoteUser(userId: string) {
    var demoteUrl = `${environment.apiUrl}user/remove-manager-role/${userId}`;
    return this.http.post<{ message: string }>(demoteUrl, {});
  }

}
