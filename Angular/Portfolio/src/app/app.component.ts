import { Component } from '@angular/core';
import { FooterSectionComponent } from './footer-section/footer-section.component';
import { AboutmeSectionComponent } from './aboutme-section/aboutme-section.component';
import { HeroSectionComponent } from './hero-section/hero-section.component';
import { PortfolioSectionComponent } from './portfolio-section/portfolio-section.component';
import { SkillsSectionComponent } from './skills-section/skills-section.component';

@Component({
  selector: 'app-root',
  imports: [
    FooterSectionComponent,
    AboutmeSectionComponent,
    HeroSectionComponent,
    PortfolioSectionComponent,
    SkillsSectionComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'Portfolio';
}
