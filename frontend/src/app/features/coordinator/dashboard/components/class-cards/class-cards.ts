import { Component, Input, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { ClassBreakdown } from '../../../../../core/models/dashboard.model';
import { Card } from '../../../../../shared/components/card/card';

/**
 * Replaces class-tabs (which only filtered the student table below it, with
 * no stats of its own). Each card shows real per-class fee stats and
 * navigates to a dedicated class-detail page on click — class filtering no
 * longer happens inline on the dashboard.
 */
@Component({
  selector: 'app-class-cards',
  imports: [DecimalPipe, MatIconModule, Card],
  templateUrl: './class-cards.html',
  styleUrl: './class-cards.scss',
})
export class ClassCards {
  @Input() breakdown: ClassBreakdown[] = [];

  private readonly router = inject(Router);

  // Kept out of the status palette (green/red/gray/accent are all spoken
  // for) so class identity never reads as a fee status by accident.
  private readonly classColorPalette = ['#6366F1', '#0EA5E9', '#8B5CF6', '#D946EF', '#14B8A6'];

  // Fixed academic order, independent of whatever order the API returns.
  // "PRE-9" is checked as a substring match (see gradeRank) so it wins over
  // the "9" match even though both would match a naive digit regex.
  private readonly gradeOrder = ['PRE-9', '9', '10', '11', '12'];

  // Stable sort (guaranteed by spec in modern JS engines): batches sharing a
  // grade — e.g. multiple sections of 9th — keep their original relative
  // order from `breakdown` rather than being reshuffled.
  get sortedBreakdown(): ClassBreakdown[] {
    return [...this.breakdown].sort(
      (a, b) => this.gradeRank(a.batch_name) - this.gradeRank(b.batch_name),
    );
  }

  private gradeRank(batchName: string): number {
    const normalized = batchName.toUpperCase();

    if (normalized.includes('PRE')) {
      return this.gradeOrder.indexOf('PRE-9');
    }

    const match = normalized.match(/\d+/);
    if (match) {
      const idx = this.gradeOrder.indexOf(match[0]);
      if (idx !== -1) return idx;
    }

    // Anything unrecognized sorts last rather than crashing the sort.
    return this.gradeOrder.length;
  }

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