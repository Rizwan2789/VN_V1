import { Component, inject, signal } from '@angular/core';

import { FeeRecordWithPayments, MonthSelection } from '../../../core/models/fee-record.model';
import { Student } from '../../../core/models/student.model';
import { AppHeader } from '../../../shared/components/app-header/app-header';
import { FeeMonthDetail, ReceiptDownload } from '../../../shared/components/fee-month-detail/fee-month-detail';
import { FeeTimeline } from '../../../shared/components/fee-timeline/fee-timeline';
import { FeeCalendarGrid } from './components/fee-calendar-grid/fee-calendar-grid';
import { StudentHeader } from './components/student-header/student-header';
import { StudentPortalService } from '../services/student-portal.service';

@Component({
  selector: 'app-portal',
  imports: [AppHeader, StudentHeader, FeeTimeline, FeeCalendarGrid, FeeMonthDetail],
  templateUrl: './portal.html',
  styleUrl: './portal.scss',
})
export class Portal {
  private readonly portalService = inject(StudentPortalService);

  readonly student = signal<Student | null>(null);
  readonly fees = signal<FeeRecordWithPayments[]>([]);
  readonly loading = signal(true);
  readonly year = signal(new Date().getFullYear());
  readonly selection = signal<MonthSelection | null>(null);

  constructor() {
    this.portalService.getMyProfile().subscribe((student) => this.student.set(student));
    this.loadFees();
  }

  private loadFees(): void {
    this.loading.set(true);
    this.portalService.getMyFees(this.year()).subscribe({
      next: (fees) => {
        this.fees.set(fees);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onYearChange(year: number): void {
    this.year.set(year);
    this.selection.set(null);
    this.loadFees();
  }

  onMonthSelected(selection: MonthSelection): void {
    this.selection.set(selection);
  }

  downloadReceipt(event: ReceiptDownload): void {
    this.portalService.downloadReceipt(event.paymentId, event.receiptNumber);
  }
}
