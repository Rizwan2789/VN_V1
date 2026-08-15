import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { StudentCreatedResponse } from '../models/student.model';
import {
  SignupRequest,
  SignupRequestApprove,
  SignupRequestCreate,
  SignupRequestListResponse,
} from '../models/signup-request.model';

@Injectable({ providedIn: 'root' })
export class SignupRequestService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/signup-requests`;

  /** Public — no auth required, used by the self-signup page. */
  submit(payload: SignupRequestCreate): Observable<SignupRequest> {
    return this.http.post<SignupRequest>(this.baseUrl, payload);
  }

  list(filters: { status?: string; page?: number; pageSize?: number } = {}): Observable<SignupRequestListResponse> {
    let params = new HttpParams();
    if (filters.status) params = params.set('status', filters.status);
    if (filters.page) params = params.set('page', filters.page);
    if (filters.pageSize) params = params.set('page_size', filters.pageSize);

    return this.http.get<SignupRequestListResponse>(this.baseUrl, { params });
  }

  approve(id: number, payload: SignupRequestApprove): Observable<StudentCreatedResponse> {
    return this.http.post<StudentCreatedResponse>(`${this.baseUrl}/${id}/approve`, payload);
  }

  reject(id: number, reason?: string): Observable<SignupRequest> {
    return this.http.post<SignupRequest>(`${this.baseUrl}/${id}/reject`, { reason });
  }
}
