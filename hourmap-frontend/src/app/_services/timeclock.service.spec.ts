import { TestBed } from '@angular/core/testing';

import { TimeclockService } from './timeclock.service';

describe('TimeclockService', () => {
  let service: TimeclockService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimeclockService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
