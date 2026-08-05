import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // withComponentInputBinding: route params bind straight to component
    // @Input()s (used by class-detail's batchId and student-fee-page's id).
    provideRouter(routes, withComponentInputBinding()),
    // Angular Material 21 uses native CSS transitions — no animations module needed.
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
  ],
};
