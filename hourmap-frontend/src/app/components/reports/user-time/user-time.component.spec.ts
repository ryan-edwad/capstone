import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserTimeComponent } from './user-time.component';

describe('UserTimeComponent', () => {
  let component: UserTimeComponent;
  let fixture: ComponentFixture<UserTimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserTimeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UserTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
