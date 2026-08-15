import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ClassBreakdown, DashboardMetrics } from '../../../core/models/dashboard.model';
import { AppHeader } from '../../../shared/components/app-header/app-header';
import { staggerReveal } from '../../../shared/animations/motion';
import { DashboardService } from '../services/dashboard.service';
import { FeeService } from '../services/fee.service';
import { ClassCards } from './components/class-cards/class-cards';
import { MetricFilter, MetricsHeader } from './components/metrics-header/metrics-header';

/**
 * KPI overview plus a class-by-class attention widget — the same class-cards
 * grid used on the Classes page, so overdue-heavy classes are visible the
 * moment a coordinator lands here instead of requiring a second click.
 */
@Component({
  selector: 'app-dashboard',
  imports: [AppHeader, MatButtonModule, MatIconModule, MetricsHeader, ClassCards],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly dashboardService = inject(DashboardService);
  private readonly feeService = inject(FeeService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  readonly metrics = signal<DashboardMetrics | null>(null);
  readonly classBreakdown = signal<ClassBreakdown[]>([]);
  readonly generatingInvoices = signal(false);

  readonly classesMissingInvoices = computed(() => this.classBreakdown().filter((c) => c.no_record_count > 0));

  constructor() {
    this.loadMetrics();
    this.loadClassBreakdown();
  }

  private loadMetrics(): void {
    this.dashboardService.getMetrics().subscribe((metrics) => {
      this.metrics.set(metrics);
      setTimeout(() => staggerReveal(document.querySelectorAll('.metric-card')), 0);
    });
  }

  private loadClassBreakdown(): void {
    this.dashboardService.getClassBreakdown().subscribe((breakdown) => {
      // Classes needing the most attention (overdue, then pending) surface first.
      this.classBreakdown.set(
        [...breakdown].sort((a, b) => b.overdue_count - a.overdue_count || b.pending_count - a.pending_count),
      );
      setTimeout(() => staggerReveal(document.querySelectorAll('.class-cards-grid > *')), 0);
    });
  }

  onMetricClick(filter: MetricFilter): void {
    this.router.navigate(['/coordinator/students'], { queryParams: { status: filter.toUpperCase() } });
  }

  generateAllInvoices(): void {
    const today = new Date();
    this.generatingInvoices.set(true);
    this.feeService.generate(today.getMonth() + 1, today.getFullYear()).subscribe({
      next: (created) => {
        this.generatingInvoices.set(false);
        this.snackBar.open(`Generated ${created.length} invoice(s).`, 'Dismiss', { duration: 5000 });
        this.loadMetrics();
        this.loadClassBreakdown();
      },
      error: () => {
        this.generatingInvoices.set(false);
        this.snackBar.open('Could not generate invoices. Please try again.', 'Dismiss', { duration: 5000 });
      },
    });
  }
}
