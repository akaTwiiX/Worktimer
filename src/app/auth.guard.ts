import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase-config';

function getCurrentUser() {
  return new Promise<typeof auth.currentUser>(resolve => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      unsubscribe();
      resolve(user);
    });
  });
}

export const authGuard: CanActivateFn = async () => {
  const router = inject(Router);

  const user = auth.currentUser ?? (await getCurrentUser());

  if (user && user.emailVerified) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
