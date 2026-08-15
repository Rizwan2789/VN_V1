import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Batch } from '../../../core/models/batch.model';

@Injectable({ providedIn: 'root' })
export class BatchService {
  private readonly http = inject(HttpClient);

  list(): Observable<Batch[]> {
    return this.http.get<Batch[]>(`${environment.apiBaseUrl}/api/batches`);
  }

  /** Public — no auth required, used by the self-signup page's class picker. */
  listPublic(): Observable<Batch[]> {
    return this.http.get<Batch[]>(`${environment.apiBaseUrl}/api/batches/public`);
  }
}
