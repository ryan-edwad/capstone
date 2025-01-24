import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreasurePathBackgroundComponent } from './treasure-path-background.component';

describe('TreasurePathBackgroundComponent', () => {
  let component: TreasurePathBackgroundComponent;
  let fixture: ComponentFixture<TreasurePathBackgroundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreasurePathBackgroundComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TreasurePathBackgroundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
