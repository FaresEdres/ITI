import { ProductsRequestsService } from './../services/products-requests.service';
import { Component, OnInit } from '@angular/core';
import * as itemsData from '../../assets/products.json';
import { ItemCardComponent } from '../item-card/item-card.component';
import { Product } from './Product';
@Component({
  selector: 'app-items-list',
  imports: [ItemCardComponent],
  templateUrl: './items-list.component.html',
  styleUrl: './items-list.component.css',
})
export class ItemsListComponent {
  items: Product[] = [];
  constructor(private productsRequestsService: ProductsRequestsService) {
    let storedData = localStorage.getItem('addedToCart');
  }

  ngOnInit() {
    this.productsRequestsService
      .getProductsList()
      .subscribe((res) => (this.items = res.products));
  }

  //   this.productsRequestsService.getProductsList().subscribe({
  //     next: (res) => (this.items = res),
  //     error: (err) => console.error('Error fetching products:', err),
  //   });
  // }
}
