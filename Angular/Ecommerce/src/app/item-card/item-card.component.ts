import { Component, Input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Product } from '../items-list/Product';
import { Cart } from '../cart/Cart';
import { CartCounterService } from '../services/cart-counter.service';

@Component({
  selector: 'app-item-card',
  imports: [RouterLink],
  templateUrl: './item-card.component.html',
  styleUrl: './item-card.component.css',
})
export class ItemCardComponent {
  @Input() itemCard!: Product;
  constructor(
    private router: Router,
    private cartCounterService: CartCounterService
  ) {}

  addToCart(item: Product) {
    const cartItem: Cart = {
      id: item.id,
      name: item.title,
      price: item.price,
      count: 1,
    };
    this.cartCounterService.setCartItem(cartItem);
  }
  // userCart?: Cart;
  // constructor(private router: Router, private storageService: StorageService) {}

  // ngOnInit() {
  //   this.userCart = this.storageService.getItem('userCart');
  // }

  // saveUserData() {
  //   if (this.userCart) {
  //     this.storageService.setItem('userCart', this.userCart);
  //   }
  // }
  // addToCart(id: number) {
  //   this.userCart.
  // }
}
