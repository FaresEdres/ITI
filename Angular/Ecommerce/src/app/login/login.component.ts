import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  loginValues = {
    email: '',
    password: '',
  };
  handleFormSubmit(loginForm: any) {
    console.log(loginForm);
  }
}
