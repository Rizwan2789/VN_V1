import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { UserRole } from '../models/user.model';
import { PasswordResetRequest, PasswordResetRequestListResponse } from '../models/password-reset-request.model';

@Injectable({ providedIn: 'root' })
export class PasswordResetRequestService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/password-reset-requests`;

  /** Public — no auth required, used by the login page's "Forgot password?" flow.
   * Always resolves the same way regardless of whether the account exists. */
  submit(role: UserRole, loginId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(this.baseUrl, { role, login_id: loginId });
  }

  list(filters: { status?: string; page?: number; pageSize?: number } = {}): Observable<PasswordResetRequestListResponse> {
    let params = new HttpParams();
    if (filters.status) params = params.set('status', filters.status);
    if (filters.page) params = params.set('page', filters.page);
    if (filters.pageSize) params = params.set('page_size', filters.pageSize);

    return this.http.get<PasswordResetRequestListResponse>(this.baseUrl, { params });
  }

  approve(id: number): Observable<{ temporary_password: string }> {
    return this.http.post<{ temporary_password: string }>(`${this.baseUrl}/${id}/approve`, {});
  }

  reject(id: number, reason?: string): Observable<PasswordResetRequest> {
    return this.http.post<PasswordResetRequest>(`${this.baseUrl}/${id}/reject`, { reason });
  }
}
