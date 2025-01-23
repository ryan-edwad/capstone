import { TestBed } from '@angular/core/testing';

import { OrganizationDataService } from './organization-data.service';

describe('OrganizationDataService', () => {
  let service: OrganizationDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrganizationDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
