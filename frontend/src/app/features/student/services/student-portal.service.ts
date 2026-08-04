import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { FeeRecordWithPayments } from '../../../core/models/fee-record.model';
import { Student } from '../../../core/models/student.model';

@Injectable({ providedIn: 'root' })
export class StudentPortalService {
  private readonly http = inject(HttpClient);

  getMyProfile(): Observable<Student> {
    return this.http.get<Student>(`${environment.apiBaseUrl}/api/students/me`);
  }

  getMyFees(year: number): Observable<FeeRecordWithPayments[]> {
    return this.http.get<FeeRecordWithPayments[]>(`${environment.apiBaseUrl}/api/students/me/fees`, {
      params: { year },
    });
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
