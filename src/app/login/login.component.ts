import { Component } from '@angular/core';
import { FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebase-config';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  emailFormControl = new FormControl('', [Validators.required, Validators.email]);
  passwordFormControl = new FormControl('', [Validators.required, Validators.minLength(8)]);
  errorMessage = '';
  emailNotVerified = false;
  verificationEmailSent = false;
  isLoading = true;

  constructor(private router: Router) {
    auth.onAuthStateChanged((user) => {
      this.isLoading = false;
      if (user && user.emailVerified) {
        this.router.navigate(['/']);
      }
    })
  }

  async login() {
    if (!this.emailFormControl.value || !this.passwordFormControl.value) {
      return;
    }
    try {
      this.isLoading = true;
      this.errorMessage = '';
      this.emailNotVerified = false;

      const userCredential = await signInWithEmailAndPassword(auth, this.emailFormControl.value, this.passwordFormControl.value);
      const user = userCredential.user;
      console.log('Successfully logged in:', user);

      if (!user.emailVerified) {
        this.emailNotVerified = true;
        console.log('Email not verified');
        return;
      }

      this.router.navigate(['/']);
    } catch (error: any) {
      console.error('Login error:', error);

      switch (error.code) {
        case 'auth/invalid-email':
          this.errorMessage = 'Ungültige E-Mail-Adresse.';
          break;
        case 'auth/user-disabled':
          this.errorMessage = 'Dieser Benutzer wurde deaktiviert.';
          break;
        case 'auth/invalid-credential':
          this.errorMessage = 'Ungültige Anmeldedaten. Bitte überprüfen Sie E-Mail und Passwort.';
          break;
        case 'auth/too-many-requests':
          this.errorMessage = 'Zu viele fehlgeschlagene Anmeldeversuche. Bitte versuchen Sie es später erneut.';
          break;
        case 'auth/network-request-failed':
          this.errorMessage = 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.';
          break;
        default:
          this.errorMessage = 'Ein Fehler ist aufgetreten: ' + error.message;
      }
    } finally {
      this.isLoading = false;
    }
  }

  async resendVerificationEmail() {
    const user = auth.currentUser;
    if (user) {
      try {
        await sendEmailVerification(user);
        this.verificationEmailSent = true;
        console.log('Verification email resent');
      } catch (error: any) {
        console.error('Error sending verification email:', error);
        this.errorMessage = 'Fehler beim Senden der E-Mail: ' + error.message;
      }
    }
  }

}
