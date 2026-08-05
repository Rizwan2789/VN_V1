import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { DashboardMetrics } from '../../../../../core/models/dashboard.model';
import { Card } from '../../../../../shared/components/card/card';
import { HoverLiftDirective } from '../../../../../shared/directives/hover-lift.directive';

export type MetricFilter = 'pending' | 'overdue';

@Component({
  selector: 'app-metrics-header',
  imports: [MatIconModule, Card, HoverLiftDirective],
  templateUrl: './metrics-header.html',
  styleUrl: './metrics-header.scss',
})
export class MetricsHeader {
  @Input() metrics: DashboardMetrics | null = null;
  /** Pending/Overdue drill into the student table below; Collected/Active have no sensible target so stay static. */
  @Output() metricClick = new EventEmitter<MetricFilter>();
}
