import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { FeeRecordWithPayments } from '../../../core/models/fee-record.model';
import { Student } from '../../../core/models/student.model';
import { AppHeader } from '../../../shared/components/app-header/app-header';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { FeeCalendarGrid, MonthSelection } from './components/fee-calendar-grid/fee-calendar-grid';
import { StudentHeader } from './components/student-header/student-header';
import { StudentPortalService } from '../services/student-portal.service';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

@Component({
  selector: 'app-portal',
  imports: [MatButtonModule, MatIconModule, AppHeader, StudentHeader, FeeCalendarGrid, StatusBadge],
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

  monthName(month: number): string {
    return MONTH_NAMES[month - 1];
  }

  downloadReceipt(paymentId: number, receiptNumber: string): void {
    this.portalService.downloadReceipt(paymentId, receiptNumber);
  }
}
