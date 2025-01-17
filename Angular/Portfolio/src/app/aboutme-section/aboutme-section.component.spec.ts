import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutmeSectionComponent } from './aboutme-section.component';

describe('AboutmeSectionComponent', () => {
  let component: AboutmeSectionComponent;
  let fixture: ComponentFixture<AboutmeSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutmeSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AboutmeSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
