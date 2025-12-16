import { Component } from '@angular/core';
import { FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebase-config';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-register',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  emailFormControl = new FormControl('', [Validators.required, Validators.email]);
  passwordFormControl = new FormControl('', [Validators.required, Validators.minLength(8)]);
  passwordConfirmFormControl = new FormControl('', [Validators.required, Validators.minLength(8)]);
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(private router: Router) { }

  async register() {
    if (!this.emailFormControl.valid || !this.passwordFormControl.valid || !this.passwordConfirmFormControl.valid) {
      this.errorMessage = 'Bitte füllen Sie alle Felder korrekt aus.';
      return;
    }

    if (this.passwordFormControl.value !== this.passwordConfirmFormControl.value) {
      this.errorMessage = 'Die Passwörter stimmen nicht überein.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        this.emailFormControl.value!,
        this.passwordFormControl.value!
      );
      const user = userCredential.user;
      console.log('User successfully registered:', user);

      await sendEmailVerification(user);
      console.log('Verification email sent');

      this.successMessage = 'Registrierung erfolgreich! Bitte überprüfen Sie Ihr E-Mail-Postfach und bestätigen Sie Ihre E-Mail-Adresse.';

      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 3000);

    } catch (error: any) {
      console.error('Registration error:', error);

      switch (error.code) {
        case 'auth/email-already-in-use':
          this.errorMessage = 'Diese E-Mail-Adresse wird bereits verwendet.';
          break;
        case 'auth/invalid-email':
          this.errorMessage = 'Ungültige E-Mail-Adresse.';
          break;
        case 'auth/weak-password':
          this.errorMessage = 'Das Passwort ist zu schwach. Bitte verwenden Sie mindestens 8 Zeichen.';
          break;
        default:
          this.errorMessage = 'Ein Fehler ist aufgetreten: ' + error.message;
      }
    } finally {
      this.isLoading = false;
    }
  }
}
