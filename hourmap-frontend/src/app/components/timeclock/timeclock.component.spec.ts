import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeclockComponent } from './timeclock.component';

describe('TimeclockComponent', () => {
  let component: TimeclockComponent;
  let fixture: ComponentFixture<TimeclockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeclockComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TimeclockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
