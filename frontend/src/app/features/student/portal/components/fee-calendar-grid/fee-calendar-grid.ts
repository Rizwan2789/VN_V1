import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { FeeRecordWithPayments, MonthSelection } from '../../../../../core/models/fee-record.model';
import { FeeDetailCell } from '../fee-detail-cell/fee-detail-cell';

@Component({
  selector: 'app-fee-calendar-grid',
  imports: [MatButtonModule, MatIconModule, FeeDetailCell],
  templateUrl: './fee-calendar-grid.html',
  styleUrl: './fee-calendar-grid.scss',
})
export class FeeCalendarGrid {
  @Input() records: FeeRecordWithPayments[] = [];
  @Input() year = new Date().getFullYear();
  @Input() selectedMonth: number | null = null;

  @Output() yearChange = new EventEmitter<number>();
  @Output() monthSelected = new EventEmitter<MonthSelection>();

  readonly months = Array.from({ length: 12 }, (_, i) => i + 1);

  private readonly today = new Date();

  recordFor(month: number): FeeRecordWithPayments | null {
    return this.records.find((r) => r.period_month === month) ?? null;
  }

  isCurrentMonth(month: number): boolean {
    return this.year === this.today.getFullYear() && month === this.today.getMonth() + 1;
  }

  selectMonth(month: number): void {
    this.monthSelected.emit({ month, record: this.recordFor(month) });
  }

  previousYear(): void {
    this.yearChange.emit(this.year - 1);
  }

  nextYear(): void {
    this.yearChange.emit(this.year + 1);
  }
}
