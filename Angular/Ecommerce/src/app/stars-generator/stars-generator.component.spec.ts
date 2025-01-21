import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StarsGeneratorComponent } from './stars-generator.component';
import { NgxStarsModule } from 'ngx-stars';

describe('StarsGeneratorComponent', () => {
  let component: StarsGeneratorComponent;
  let fixture: ComponentFixture<StarsGeneratorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StarsGeneratorComponent, NgxStarsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(StarsGeneratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
