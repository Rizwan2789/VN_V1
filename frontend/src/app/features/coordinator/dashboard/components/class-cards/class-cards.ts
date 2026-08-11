import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { ClassBreakdown } from '../../../../../core/models/dashboard.model';
import { Card } from '../../../../../shared/components/card/card';
import { HoverLiftDirective } from '../../../../../shared/directives/hover-lift.directive';

/**
 * Replaces class-tabs (which only filtered the student table below it, with
 * no stats of its own). Each card shows real per-class fee stats and
 * navigates to a dedicated class-detail page on click — class filtering no
 * longer happens inline on the dashboard.
 */
@Component({
  selector: 'app-class-cards',
  imports: [MatIconModule, Card, HoverLiftDirective],
  templateUrl: './class-cards.html',
  styleUrl: './class-cards.scss',
})
export class ClassCards {
  @Input() breakdown: ClassBreakdown[] = [];

  private readonly router = inject(Router);

  // Kept out of the status palette (green/red/gray/accent are all spoken
  // for) so class identity never reads as a fee status by accident.
  private readonly classColorPalette = ['#6366F1', '#0EA5E9', '#8B5CF6', '#D946EF', '#14B8A6'];

  collectedPercent(item: ClassBreakdown): number {
    const collected = Number(item.collected_amount);
    const pending = Number(item.pending_amount);
    const total = collected + pending;
    return total > 0 ? Math.round((collected / total) * 100) : 0;
  }

  classColor(item: ClassBreakdown): string {
    const index = item.batch_id % this.classColorPalette.length;
    return this.classColorPalette[index];
  }

  openClass(batchId: number): void {
    this.router.navigate(['/coordinator/classes', batchId]);
  }
}