import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';

import { Batch } from '../../../../../core/models/batch.model';
import { BatchBreakdown } from '../../../../../core/models/dashboard.model';

@Component({
  selector: 'app-class-tabs',
  imports: [MatTabsModule],
  templateUrl: './class-tabs.html',
  styleUrl: './class-tabs.scss',
})
export class ClassTabs {
  @Input() batches: Batch[] = [];
  @Input() breakdown: BatchBreakdown[] = [];
  @Output() batchSelected = new EventEmitter<number>();

  onTabChange(index: number): void {
    const batch = this.batches[index];
    if (batch) this.batchSelected.emit(batch.id);
  }

  countFor(batchId: number): number {
    return this.breakdown.find((b) => b.batch_id === batchId)?.student_count ?? 0;
  }
}
