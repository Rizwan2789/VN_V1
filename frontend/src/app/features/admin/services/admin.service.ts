import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AdminDashboardCounts, AdminUserListResponse } from '../../../core/models/admin.model';
import { SecurityAnswerUpsert, SecurityQuestionStatus } from '../../../core/models/security-question.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/admin`;

  getDashboard(): Observable<AdminDashboardCounts> {
    return this.http.get<AdminDashboardCounts>(`${this.baseUrl}/dashboard`);
  }

  listUsers(filters: { role?: string; search?: string; page?: number; pageSize?: number } = {}): Observable<AdminUserListResponse> {
    let params = new HttpParams();
    if (filters.role) params = params.set('role', filters.role);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.page) params = params.set('page', filters.page);
    if (filters.pageSize) params = params.set('page_size', filters.pageSize);

    return this.http.get<AdminUserListResponse>(`${this.baseUrl}/users`, { params });
  }

  resetUserPassword(userId: number): Observable<{ temporary_password: string }> {
    return this.http.post<{ temporary_password: string }>(`${this.baseUrl}/users/${userId}/reset-password`, {});
  }

  deactivateUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/${userId}`);
  }

  getMySecurityQuestions(): Observable<SecurityQuestionStatus[]> {
    return this.http.get<SecurityQuestionStatus[]>(`${this.baseUrl}/me/security-questions`);
  }

  updateMySecurityAnswers(answers: SecurityAnswerUpsert[]): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/me/security-questions`, { answers });
  }
}
