import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClockBackgroundComponent } from './clock-background.component';

describe('ClockBackgroundComponent', () => {
  let component: ClockBackgroundComponent;
  let fixture: ComponentFixture<ClockBackgroundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClockBackgroundComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ClockBackgroundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
