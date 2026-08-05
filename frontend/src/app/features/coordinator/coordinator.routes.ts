import { Routes } from '@angular/router';

export const COORDINATOR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./shell/coordinator-shell').then((m) => m.CoordinatorShell),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'students',
        loadComponent: () => import('./students/students-page/students-page').then((m) => m.StudentsPage),
      },
      {
        path: 'students/:id/fees',
        loadComponent: () => import('./students/student-fee-page/student-fee-page').then((m) => m.StudentFeePage),
      },
      {
        path: 'classes',
        loadComponent: () => import('./classes/classes-page/classes-page').then((m) => m.ClassesPage),
      },
      {
        path: 'classes/:batchId',
        loadComponent: () => import('./classes/class-detail/class-detail').then((m) => m.ClassDetail),
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
];
