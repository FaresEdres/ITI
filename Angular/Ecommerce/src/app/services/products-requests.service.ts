import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Product } from '../items-list/Product';

@Injectable({
  providedIn: 'root',
})
export class ProductsRequestsService {
  constructor(private http: HttpClient) {}
  getProductsList(): Observable<any> {
    return this.http.get<any>('https://dummyjson.com/products');
  }
}
