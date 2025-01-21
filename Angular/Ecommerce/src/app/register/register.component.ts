import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  registerForm: FormGroup;
  constructor() {
    this.registerForm = new FormGroup({
      confirmPassword: new FormControl('', Validators.required),
      username: new FormControl('', [
        Validators.required,
        Validators.pattern(
          '^(?![W])(?!.*\\.\\.)(?!.*\\.$)[a-zA-Z0-9._]{1,30}$'
        ),
      ]),
      name: new FormControl('', [Validators.required]),
      email: new FormControl('', [
        Validators.pattern('^[\\w-.]+@([\\w-]+\\.)+[\\w-]{2,4}$'),
        Validators.required,
      ]),
      password: new FormControl('', [
        Validators.pattern(
          '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*_=+-]).{8,20}$'
        ),
        Validators.required,
      ]),
    });
  }
  get RegisterFormControls() {
    return this.registerForm.controls;
  }
  handleRegisterSubmit() {
    console.log(this.registerForm);
  }
}
