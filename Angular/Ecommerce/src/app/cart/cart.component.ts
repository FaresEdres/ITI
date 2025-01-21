import { CartCounterService } from './../services/cart-counter.service';
import { Component, NgModule } from '@angular/core';
import { Cart } from './Cart';

@Component({
  selector: 'app-cart',
  imports: [],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css',
})
export class CartComponent {
  cartItems: Cart[] = [];
  totalProducts: number = 0;
  constructor(private cartCounterService: CartCounterService) {}
  ngOnInit() {
    this.cartCounterService.getCartItem().subscribe((items) => {
      this.cartItems = items;
      // this.calculateTotalProducts();
    });
  }

  addToCart(item: Cart) {
    this.cartCounterService.setCartItem(item);
  }

  decrementCartItem(id: number) {
    this.cartCounterService.decrementCartItem(id);
  }

  removeCartItem(id: number) {
    this.cartCounterService.removeCartItem(id);
  }

  calculateTotalPrice() {
    return this.cartItems.reduce(
      (total, curr) => total + curr.price * curr.count,
      0
    );
  }
}
