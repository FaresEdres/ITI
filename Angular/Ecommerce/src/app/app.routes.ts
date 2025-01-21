import { Component } from '@angular/core';
import { CartComponent } from './cart/cart.component';
import { ItemDetailsComponent } from './item-details/item-details.component';
import { ItemsListComponent } from './items-list/items-list.component';
import { Routes } from '@angular/router';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { NotFoundComponent } from './not-found/not-found.component';

export const routes: Routes = [
  {
    path: '',
    component: ItemsListComponent,
  },
  {
    path: 'cart',
    component: CartComponent,
  },
  {
    path: 'item-details/:id',
    component: ItemDetailsComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: '**',
    component: NotFoundComponent,
  },
];
