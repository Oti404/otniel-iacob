import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcademicJourneyComponent } from './academic-journey';

describe('AcademicJourneyComponent', () => {
  let component: AcademicJourneyComponent;
  let fixture: ComponentFixture<AcademicJourneyComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcademicJourneyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AcademicJourneyComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
