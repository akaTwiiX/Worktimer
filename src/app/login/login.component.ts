import { Component } from '@angular/core';
import { FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase-config';

@Component({
  selector: 'app-login',
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  emailFormControl = new FormControl('', [Validators.required, Validators.email]);
  passwordFormControl = new FormControl('', [Validators.required, Validators.minLength(8)]);
  errorMessage = '';

  constructor(private router: Router) {
    auth.onAuthStateChanged((user) => {
      if (user) {
        this.router.navigate(['/']);
      }
    })
  }

  async login() {
    if (!this.emailFormControl.value || !this.passwordFormControl.value) {
      return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, this.emailFormControl.value, this.passwordFormControl.value);
      const user = userCredential.user;
      console.log('Erfolgreich eingeloggt:', user);
      this.router.navigate(['/']);
      // Optional: Navigiere nach dem Login, z. B. mit Router
    } catch (error: any) {
      this.errorMessage = error.message;
      console.error('Login-Fehler:', error);
    }
  }

}
