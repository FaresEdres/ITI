import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  constructor() {}
  getItem(key: string) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
  setItem(key: string, value: any) {
    const data = JSON.stringify(value);
    window.localStorage.setItem(key, data);
  }
  removeItem(key: string) {
    window.localStorage.removeItem(key);
  }
}
