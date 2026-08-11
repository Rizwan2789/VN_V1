import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of, switchMap } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { FeeRecordWithPayments } from '../../../core/models/fee-record.model';
import {
  Student,
  StudentCreate,
  StudentCreatedResponse,
  StudentListItem,
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

  /**
   * `list()` is server-paginated (page_size capped at 100), but neither the
   * Students page nor a class roster needs partial pages — they need the
   * complete matching set for on-screen display, sorting, and CSV export.
   * Loops pages and accumulates, capped at 20 pages (2,000 students) as a
   * safety bound against a runaway request loop, well beyond this app's
   * realistic scale.
   */
  listAll(filters: Omit<StudentListFilters, 'page' | 'pageSize'>): Observable<StudentListItem[]> {
    const pageSize = 100;
    const maxPages = 20;
    const fetchPage = (page: number, acc: StudentListItem[]): Observable<StudentListItem[]> =>
      this.list({ ...filters, page, pageSize }).pipe(
        switchMap((res) => {
          const items = [...acc, ...res.items];
          return items.length < res.total && page < maxPages ? fetchPage(page + 1, items) : of(items);
        }),
      );

    return fetchPage(1, []);
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
