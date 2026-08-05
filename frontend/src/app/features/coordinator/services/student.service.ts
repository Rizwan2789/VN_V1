import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { FeeRecordWithPayments } from '../../../core/models/fee-record.model';
import {
  Student,
  StudentCreate,
  StudentCreatedResponse,
  StudentListResponse,
  StudentUpdate,
} from '../../../core/models/student.model';

export interface StudentListFilters {
  batchId?: number;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class StudentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/students`;

  list(filters: StudentListFilters): Observable<StudentListResponse> {
    let params = new HttpParams();
    if (filters.batchId != null) params = params.set('batch_id', filters.batchId);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.page) params = params.set('page', filters.page);
    if (filters.pageSize) params = params.set('page_size', filters.pageSize);

    return this.http.get<StudentListResponse>(this.baseUrl, { params });
  }

  get(id: number): Observable<Student> {
    return this.http.get<Student>(`${this.baseUrl}/${id}`);
  }

  create(payload: StudentCreate): Observable<StudentCreatedResponse> {
    return this.http.post<StudentCreatedResponse>(this.baseUrl, payload);
  }

  update(id: number, payload: StudentUpdate): Observable<Student> {
    return this.http.put<Student>(`${this.baseUrl}/${id}`, payload);
  }

  deactivate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getFees(id: number, year: number): Observable<FeeRecordWithPayments[]> {
    return this.http.get<FeeRecordWithPayments[]>(`${this.baseUrl}/${id}/fees`, { params: { year } });
  }

  downloadReceipt(paymentId: number, receiptNumber: string): void {
    this.http
      .get(`${environment.apiBaseUrl}/api/payments/${paymentId}/receipt`, { responseType: 'blob' })
      .subscribe((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${receiptNumber}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
      });
  }
}
