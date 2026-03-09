import { Component, inject } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { auth } from '../../firebase-config';

@Component({
  selector: 'app-register',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ProgressSpinnerModule,
    InputTextModule,
    FloatLabelModule,
    ButtonModule,
    MessageModule,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  emailFormControl = new FormControl('', [Validators.required, Validators.email]);
  passwordFormControl = new FormControl('', [Validators.required, Validators.minLength(8)]);
  passwordConfirmFormControl = new FormControl('', [Validators.required, Validators.minLength(8)]);
  errorMessage = '';
  successMessage = '';
  isLoading = false;
  private router = inject(Router);

  async register() {
    if (!this.emailFormControl.value || !this.passwordFormControl.value || !this.passwordConfirmFormControl.value) {
      return;
    }

    if (this.passwordFormControl.value !== this.passwordConfirmFormControl.value) {
      this.errorMessage = 'Die Passwörter stimmen nicht überein.';
      return;
    }

    try {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const userCredential = await createUserWithEmailAndPassword(auth, this.emailFormControl.value, this.passwordFormControl.value);
      const user = userCredential.user;
      console.log('Successfully registered:', user);

      await sendEmailVerification(user);
      console.log('Verification email sent');

      this.successMessage = 'Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mails zur Verifizierung.';

      setTimeout(() => this.router.navigate(['/login']), 5000);
    } catch (error: any) {
      console.error('Registration error:', error);

      switch (error.code) {
        case 'auth/email-already-in-use':
          this.errorMessage = 'Diese E-Mail-Adresse wird bereits verwendet.';
          break;
        case 'auth/invalid-email':
          this.errorMessage = 'Ungültige E-Mail-Adresse.';
          break;
        case 'auth/operation-not-allowed':
          this.errorMessage = 'E-Mail/Passwort-Registrierung ist nicht aktiviert.';
          break;
        case 'auth/weak-password':
          this.errorMessage = 'Das Passwort ist zu schwach.';
          break;
        default:
          this.errorMessage = `Ein Fehler ist aufgetreten: ${error.message}`;
      }
    } finally {
      this.isLoading = false;
    }
  }
}
