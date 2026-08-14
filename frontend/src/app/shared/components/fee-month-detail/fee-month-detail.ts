import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { FeeRecordWithPayments } from '../../../core/models/fee-record.model';
import { StatusBadge } from '../status-badge/status-badge';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export interface ReceiptDownload {
  paymentId: number;
  receiptNumber: string;
}

/**
 * Extracted from the student portal's original inline `.detail-card` markup
 * so it can be reused, unchanged, on the coordinator's per-student fee page —
 * those two screens previously had no shared visual pattern at all. The
 * `detail-actions` slot is where the coordinator-only "Record Payment"
 * control gets projected in; the student portal simply doesn't fill it.
 */
@Component({
  selector: 'app-fee-month-detail',
  imports: [DatePipe, MatButtonModule, MatIconModule, StatusBadge],
  templateUrl: './fee-month-detail.html',
  styleUrl: './fee-month-detail.scss',
})
export class FeeMonthDetail {
  @Input({ required: true }) month!: number;
  @Input({ required: true }) year!: number;
  @Input() record: FeeRecordWithPayments | null = null;
  @Output() downloadReceipt = new EventEmitter<ReceiptDownload>();

  get monthName(): string {
    return MONTH_NAMES[this.month - 1];
  }
}
