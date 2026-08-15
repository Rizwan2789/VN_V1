import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { FeeRecordWithPayments, FeeStatus, MonthSelection } from '../../../core/models/fee-record.model';

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type StatusKey = FeeStatus | 'NONE';

const STATUS_LABEL: Record<StatusKey, string> = {
  PAID: 'Paid',
  PARTIAL: 'Partial',
  PENDING: 'Pending',
  OVERDUE: 'Overdue',
  NONE: 'No record',
};

// Small inline glyphs instead of the Material icon font — crisp at the
// ~16px size a 12-up month strip has room for, and each stroke follows
// `currentColor` so the segment's own status class alone controls the tint.
const STATUS_ICON_SVG: Record<StatusKey, string> = {
  PAID: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6.25" stroke="currentColor" stroke-width="1.4"/><path d="M5.2 8.3l1.8 1.8 3.6-3.9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  PARTIAL: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6.25" stroke="currentColor" stroke-width="1.4"/><path d="M8 8V1.75A6.25 6.25 0 0 1 14.25 8H8Z" fill="currentColor"/></svg>',
  PENDING: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6.25" stroke="currentColor" stroke-width="1.4"/><path d="M8 4.6V8.2l2.4 1.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  OVERDUE: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6.25" stroke="currentColor" stroke-width="1.4"/><path d="M8 5.1v3.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="8" cy="10.9" r="0.85" fill="currentColor"/></svg>',
  NONE: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6.25" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2.2 2.4"/></svg>',
};

/**
 * A 12-segment strip, one per month, colored by fee status — a compact
 * at-a-glance overview sitting above the existing fee-calendar-grid (which
 * stays for its richer per-month click-to-detail interaction). Shares the
 * calendar-grid's exact MonthSelection contract so both can drive one
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

  private readonly sanitizer = inject(DomSanitizer);

  readonly months = Array.from({ length: 12 }, (_, i) => i + 1);
  readonly monthAbbr = MONTH_ABBR;

  // The hover/focus card is `position: fixed` (not `absolute`) because the
  // month strip scrolls horizontally — an absolutely-positioned card would
  // get clipped by that same scroll container's overflow. Fixed needs an
  // explicit viewport position, so it's computed from the trigger's own
  // rect on enter rather than pinned in CSS.
  readonly tooltipMonth = signal<number | null>(null);
  readonly tooltipTop = signal(0);
  readonly tooltipLeft = signal(0);

  recordFor(month: number): FeeRecordWithPayments | null {
    return this.records.find((r) => r.period_month === month) ?? null;
  }

  private statusKey(month: number): StatusKey {
    return this.recordFor(month)?.status ?? 'NONE';
  }

  statusClass(month: number): string {
    return 'status-' + this.statusKey(month).toLowerCase();
  }

  statusIcon(month: number): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(STATUS_ICON_SVG[this.statusKey(month)]);
  }

  statusLabel(month: number): string {
    return STATUS_LABEL[this.statusKey(month)];
  }

  selectMonth(month: number): void {
    this.monthSelected.emit({ month, record: this.recordFor(month) });
  }

  isCurrentMonth(month: number): boolean {
    const now = new Date();
    return this.year === now.getFullYear() && month === now.getMonth() + 1;
  }

  onSegmentEnter(month: number, event: Event): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.tooltipTop.set(rect.top);
    this.tooltipLeft.set(rect.left + rect.width / 2);
    this.tooltipMonth.set(month);
  }

  onSegmentLeave(): void {
    this.tooltipMonth.set(null);
  }

  formatAmount(amount: string | number): string {
    return Number(amount).toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  paidCount(): number {
    return this.records.filter((r) => r.status === 'PAID').length;
  }

  recordedCount(): number {
    return this.records.length;
  }

  paidPercent(): number {
    const total = this.recordedCount();
    return total === 0 ? 0 : Math.round((this.paidCount() / total) * 100);
  }

  outstandingCount(): number {
    return this.records.filter((r) => Number(r.amount_due) - Number(r.amount_paid) > 0).length;
  }

  totalCollected(): number {
    return this.records.reduce((sum, r) => sum + Number(r.amount_paid), 0);
  }

  totalOutstanding(): number {
    return this.records.reduce((sum, r) => sum + Math.max(0, Number(r.amount_due) - Number(r.amount_paid)), 0);
  }
}
