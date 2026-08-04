import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRole = route.data['role'] as UserRole;
  const user = authService.currentUser();

  if (user?.role === requiredRole) return true;

  return router.createUrlTree(['/unauthorized']);
};
