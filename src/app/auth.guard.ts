import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { auth } from './firebase-config';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  const user = auth.currentUser;

  if (user && user.emailVerified) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};