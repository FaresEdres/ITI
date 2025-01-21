import { Component, Input } from '@angular/core';
import * as itemsData from '../../assets/products.json';
import { Product } from '../items-list/Product';
import { CommonModule } from '@angular/common';
import { StarsGeneratorComponent } from '../stars-generator/stars-generator.component';
@Component({
  selector: 'app-item-details',
  imports: [CommonModule, StarsGeneratorComponent],
  templateUrl: './item-details.component.html',
  styleUrl: './item-details.component.css',
})
export class ItemDetailsComponent {
  @Input() id!: number;
  items: any = itemsData.products;
  currProduct!: Product;

  ngOnInit() {
    this.currProduct = this.items.find(
      (item: { id: number }) => item.id == this.id
    );
  }
}
