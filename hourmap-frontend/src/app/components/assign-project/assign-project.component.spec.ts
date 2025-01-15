import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignProjectComponent } from './assign-project.component';

describe('AssignProjectComponent', () => {
  let component: AssignProjectComponent;
  let fixture: ComponentFixture<AssignProjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignProjectComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AssignProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
