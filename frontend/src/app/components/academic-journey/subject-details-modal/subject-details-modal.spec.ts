import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubjectDetailsModalComponent } from './subject-details-modal';

describe('SubjectDetailsModalComponent', () => {
  let component: SubjectDetailsModalComponent;
  let fixture: ComponentFixture<SubjectDetailsModalComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubjectDetailsModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubjectDetailsModalComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
