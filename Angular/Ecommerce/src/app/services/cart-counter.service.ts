import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Cart } from '../cart/Cart';
@Injectable({
  providedIn: 'root',
})
export class CartCounterService {
  private cartCounter = new BehaviorSubject<Cart[]>([]);
  getCartItem() {
    return this.cartCounter.asObservable();
  }
  setCartItem(cartItem: Cart) {
    const currCart = this.cartCounter.getValue();
    const itemIndex = currCart.findIndex((item) => item.id == cartItem.id);
    if (itemIndex > -1) {
      currCart[itemIndex].count++;
    } else {
      currCart.push({ ...cartItem, count: 1 });
    }
    this.cartCounter.next([...currCart]);
  }
  decrementCartItem(id: number) {
    const currCart = this.cartCounter.getValue();
    const itemIndex = currCart.findIndex((item) => item.id == id);
    if (itemIndex > -1 && currCart[itemIndex].count > 1) {
      currCart[itemIndex].count--;
      this.cartCounter.next([...currCart]);
    } else {
      currCart.splice(itemIndex, 1);
    }
    this.cartCounter.next([...currCart]);
  }
  removeCartItem(id: number) {
    const currCart = this.cartCounter.getValue();
    const updatedCart = currCart.filter((item) => item.id != id);
    this.cartCounter.next([...updatedCart]);
  }
}
