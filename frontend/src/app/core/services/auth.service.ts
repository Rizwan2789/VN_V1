import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { JwtPayload } from '../models/jwt-payload.model';
import { AuthUser, UserRole } from '../models/user.model';
import { TokenStorageService } from './token-storage.service';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  role: UserRole;
  full_name: string;
  student_id: number | null;
}

interface CurrentUserResponse {
  id: number;
  login_id: string;
  email: string | null;
  full_name: string;
  role: UserRole;
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorageService);

  private readonly currentUserSignal = signal<AuthUser | null>(this.readUserFromToken());

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);

  constructor() {
    // Deferred to a microtask: calling HttpClient synchronously here would run
    // errorInterceptor's `inject(AuthService)` while this constructor is still
    // on the stack, which Angular flags as a circular dependency (NG0200).
    if (this.currentUserSignal() !== null) {
      queueMicrotask(() => this.refreshCurrentUser());
    }
  }

  login(role: UserRole, loginId: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiBaseUrl}/api/auth/login`, {
        role,
        login_id: loginId,
        password,
      })
      .pipe(
        tap((response) => {
          this.tokenStorage.setToken(response.access_token);
          this.currentUserSignal.set({
            role: response.role,
            fullName: response.full_name,
            studentId: response.student_id,
          });
        }),
      );
  }

  logout(): void {
    this.tokenStorage.clearToken();
    this.currentUserSignal.set(null);
  }

  private refreshCurrentUser(): void {
    // The JWT carries role/student_id but not full_name — hydrate it from the API
    // so a page refresh doesn't show a blank name in the dashboard header.
    this.http.get<CurrentUserResponse>(`${environment.apiBaseUrl}/api/auth/me`).subscribe({
      next: (me) => this.currentUserSignal.update((user) => (user ? { ...user, fullName: me.full_name } : user)),
      error: () => this.logout(),
    });
  }

  private readUserFromToken(): AuthUser | null {
    const token = this.tokenStorage.getToken();
    if (!token) return null;

    const payload = decodeJwt(token);
    if (!payload || payload.exp * 1000 < Date.now()) {
      this.tokenStorage.clearToken();
      return null;
    }

    return {
      role: payload.role,
      fullName: '',
      studentId: payload.student_id ?? null,
    };
  }
}
