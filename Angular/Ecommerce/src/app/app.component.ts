import { Component } from '@angular/core';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { RouterOutlet } from '@angular/router';
import { NgxStarsModule } from 'ngx-stars';

@Component({
  selector: 'app-root',
  imports: [NavBarComponent, RouterOutlet, NgxStarsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'Ecommerce';
}
