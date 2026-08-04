import { Component, EventEmitter, Input, Output } from '@angular/core';

import { FeeRecordWithPayments } from '../../../../../core/models/fee-record.model';
import { StatusBadge } from '../../../../../shared/components/status-badge/status-badge';

const MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

@Component({
  selector: 'app-fee-detail-cell',
  imports: [StatusBadge],
  templateUrl: './fee-detail-cell.html',
  styleUrl: './fee-detail-cell.scss',
})
export class FeeDetailCell {
  @Input({ required: true }) monthIndex!: number; // 1-12
  @Input() record: FeeRecordWithPayments | null = null;
  @Input() isCurrentMonth = false;
  @Input() isSelected = false;
  @Output() cellClick = new EventEmitter<void>();

  get monthLabel(): string {
    return MONTH_ABBR[this.monthIndex - 1];
  }
}
