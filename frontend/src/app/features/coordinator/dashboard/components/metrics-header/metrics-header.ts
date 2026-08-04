import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { DashboardMetrics } from '../../../../../core/models/dashboard.model';

@Component({
  selector: 'app-metrics-header',
  imports: [MatIconModule],
  templateUrl: './metrics-header.html',
  styleUrl: './metrics-header.scss',
})
export class MetricsHeader {
  @Input() metrics: DashboardMetrics | null = null;
}
