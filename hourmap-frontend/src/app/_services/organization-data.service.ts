import { Injectable } from '@angular/core';
import { OrganizationService } from './organization.service';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Organization } from '../_models/organization';

@Injectable({
  providedIn: 'root'
})
export class OrganizationDataService {
  private cache: { [key: string]: Organization } = {};
  private organizationDataSubject = new BehaviorSubject<Organization | null>(null);

  constructor(private organizationService: OrganizationService) { }

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

  getCachedOrganization(orgId: number): Organization | null {
    return this.cache[orgId] || null;
  }

  clearCache(orgId: number) {
    delete this.cache[orgId];
  }

  clearAllCache() {
    this.cache = {};
  }

  get organizationData$(): Observable<Organization | null> {
    return this.organizationDataSubject.asObservable();
  }
}
