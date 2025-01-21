import { CartCounterService } from './../services/cart-counter.service';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Cart } from '../cart/Cart';
@Component({
  selector: 'app-nav-bar',
  imports: [RouterLink],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.css',
})
export class NavBarComponent {
  cartCounterService = inject(CartCounterService);
  constructor() {}
}
