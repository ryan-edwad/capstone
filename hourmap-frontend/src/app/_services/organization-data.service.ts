import { Injectable } from '@angular/core';
import { OrganizationService } from './organization.service';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Organization } from '../_models/organization';
/**
 * Service to store and retrieve organization data in a cache to avoid unnecessary requests to the server
 */
@Injectable({
  providedIn: 'root'
})
export class OrganizationDataService {
  private cache: { [key: string]: Organization } = {};
  private organizationDataSubject = new BehaviorSubject<Organization | null>(null);

  constructor(private organizationService: OrganizationService) { }

  /**
   * Retrieve organization data from the server and store it in the cache if it is not already there
   * @param orgId the id of the organization to retrieve
   * @returns A new cached organization data
   */
  getOrganization(orgId: number): Observable<Organization> {
    if (this.cache[orgId]) {
      console.log('Using cached organization data: ', this.cache[orgId]);
      return of(this.cache[orgId]);
    }
    console.log('No cache here! Fetching organization data from server!');
    return this.organizationService.getOrganization(orgId).pipe(
      map((data) => {
        this.cache[orgId] = data;
        this.organizationDataSubject.next(data);
        return data;
      })
    )
  }

  /**
   * Retrieve organization data from the cache
   * @param orgId the id/key of the organization to retrieve
   * @returns the cached organization data or null if it is not in the cache
   */
  getCachedOrganization(orgId: number): Organization | null {
    return this.cache[orgId] || null;
  }

  /**
   * Clear the an instance of organization data from the cache
   * @param orgId the id/key of the organization to clear from the cache
   */
  clearCache(orgId: number) {
    delete this.cache[orgId];
  }

  /**
   * Clear all organization data from the cache
   */
  clearAllCache() {
    this.cache = {};
  }

  /**
   * Get the observable of the organization data
   * @returns the observable of the organization data
   */
  get organizationData$(): Observable<Organization | null> {
    return this.organizationDataSubject.asObservable();
  }
}
