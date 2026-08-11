import { Component, EventEmitter, Input, Output } from '@angular/core';

import { FeeRecordWithPayments, MonthSelection } from '../../../core/models/fee-record.model';

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * A 12-segment horizontal strip, one per month, colored by fee status —
 * a compact at-a-glance overview sitting above the existing fee-calendar-grid
 * (which stays for its richer per-month click-to-detail interaction). Shares
 * the calendar-grid's exact MonthSelection contract so both can drive one
 * selection state, and is reused as-is on both the student portal and the
 * coordinator's per-student fee page.
 */
@Component({
  selector: 'app-fee-timeline',
  imports: [],
  templateUrl: './fee-timeline.html',
  styleUrl: './fee-timeline.scss',
})
export class FeeTimeline {
  @Input() records: FeeRecordWithPayments[] = [];
  @Input() year = new Date().getFullYear();
  @Input() selectedMonth: number | null = null;
  @Output() monthSelected = new EventEmitter<MonthSelection>();

  readonly months = Array.from({ length: 12 }, (_, i) => i + 1);
  readonly monthAbbr = MONTH_ABBR;

  recordFor(month: number): FeeRecordWithPayments | null {
    return this.records.find((r) => r.period_month === month) ?? null;
  }

  statusClass(month: number): string {
    const record = this.recordFor(month);
    return record ? 'status-' + record.status.toLowerCase() : 'status-none';
  }

  selectMonth(month: number): void {
    this.monthSelected.emit({ month, record: this.recordFor(month) });
  }

    isCurrentMonth(month: number): boolean {
    const now = new Date();
    return this.year === now.getFullYear() && month === now.getMonth() + 1;
  }

  tooltipFor(month: number): string {
    const record = this.recordFor(month);
    if (!record) return `${this.monthAbbr[month - 1]} ${this.year} — no record`;
    return `${this.monthAbbr[month - 1]} ${this.year} — ${record.status} · Due Rs. ${record.amount_due}, Paid Rs. ${record.amount_paid}`;
  }
  
}
