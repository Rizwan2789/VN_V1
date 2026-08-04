import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { FeeRecord } from '../../../core/models/fee-record.model';
import { Payment, PaymentCreate } from '../../../core/models/payment.model';

@Injectable({ providedIn: 'root' })
export class FeeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/fees`;

  generate(periodMonth: number, periodYear: number, batchId?: number): Observable<FeeRecord[]> {
    return this.http.post<FeeRecord[]>(`${this.baseUrl}/generate`, {
      period_month: periodMonth,
      period_year: periodYear,
      batch_id: batchId ?? null,
    });
  }

  recordPayment(feeRecordId: number, payload: PaymentCreate): Observable<Payment> {
    return this.http.post<Payment>(`${this.baseUrl}/${feeRecordId}/payments`, payload);
  }
}
