import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { ROLE_HOME_ROUTE } from '../models/user.model';

/** Keeps an already-authenticated user off the login screen, sending them to their dashboard instead. */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUser();
  if (!user) return true;

  return router.createUrlTree([ROLE_HOME_ROUTE[user.role]]);
};
