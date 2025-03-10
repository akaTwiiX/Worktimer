import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { auth } from './firebase-config';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  // Prüfe den aktuellen Benutzer synchron
  const user = auth.currentUser;

  if (user) {
    // Benutzer ist eingeloggt, Zugriff erlauben
    return true;
  } else {
    // Benutzer ist nicht eingeloggt, zur Login-Seite umleiten
    router.navigate(['/login']);
    return false;
  }
};