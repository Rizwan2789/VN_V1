import { Routes } from '@angular/router';

export const STUDENT_ROUTES: Routes = [
  {
    path: 'portal',
    loadComponent: () => import('./portal/portal').then((m) => m.Portal),
  },
  { path: '', pathMatch: 'full', redirectTo: 'portal' },
];
