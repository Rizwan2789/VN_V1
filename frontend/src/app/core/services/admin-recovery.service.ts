import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AdminForgotPasswordStartResponse } from '../models/security-question.model';

/** The admin-only forgot-password flow — a security question instead of an
 * admin-approval queue, since there's no one above admin to approve it. */
@Injectable({ providedIn: 'root' })
export class AdminRecoveryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/auth/admin/forgot-password`;

  start(loginId: string): Observable<AdminForgotPasswordStartResponse> {
    return this.http.post<AdminForgotPasswordStartResponse>(`${this.baseUrl}/start`, { login_id: loginId });
  }

  verify(challengeToken: string, answer: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/verify`, {
      challenge_token: challengeToken,
      answer,
      new_password: newPassword,
    });
  }
}
