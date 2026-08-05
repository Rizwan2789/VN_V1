import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { DashboardMetrics } from '../../../core/models/dashboard.model';
import { AppHeader } from '../../../shared/components/app-header/app-header';
import { staggerReveal } from '../../../shared/animations/motion';
import { DashboardService } from '../services/dashboard.service';
import { MetricFilter, MetricsHeader } from './components/metrics-header/metrics-header';

/**
 * Now just the KPI overview — the class-cards grid and student roster moved
 * to their own sidenav destinations (Classes, Students) so each has room to
 * be a real page instead of being crammed together on one screen.
 */
@Component({
  selector: 'app-dashboard',
  imports: [AppHeader, MetricsHeader],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly dashboardService = inject(DashboardService);
  private readonly router = inject(Router);

  readonly metrics = signal<DashboardMetrics | null>(null);

  constructor() {
    this.dashboardService.getMetrics().subscribe((metrics) => {
      this.metrics.set(metrics);
      setTimeout(() => staggerReveal(document.querySelectorAll('.metric-card')), 0);
    });
  }

  onMetricClick(filter: MetricFilter): void {
    this.router.navigate(['/coordinator/students'], { queryParams: { status: filter.toUpperCase() } });
  }
}
