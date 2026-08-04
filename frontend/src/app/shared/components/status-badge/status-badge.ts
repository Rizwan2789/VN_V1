import { Component, Input } from '@angular/core';

import { FeeStatus } from '../../../core/models/fee-record.model';

@Component({
  selector: 'app-status-badge',
  imports: [],
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.scss',
})
export class StatusBadge {
  @Input({ required: true }) status!: FeeStatus | null;

  get label(): string {
    return this.status ?? 'No Record';
  }
}
