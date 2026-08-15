import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ClassBreakdown, DashboardMetrics } from '../../../core/models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  getMetrics(): Observable<DashboardMetrics> {
    return this.http.get<DashboardMetrics>(`${environment.apiBaseUrl}/api/dashboard/metrics`);
  }

  getClassBreakdown(batchId?: number): Observable<ClassBreakdown[]> {
    let params = new HttpParams();
    if (batchId != null) params = params.set('batch_id', batchId);
    return this.http.get<ClassBreakdown[]>(`${environment.apiBaseUrl}/api/dashboard/class-breakdown`, { params });
  }
}
