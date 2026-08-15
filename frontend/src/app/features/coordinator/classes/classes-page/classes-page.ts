import { Component, inject, signal } from '@angular/core';

import { ClassBreakdown } from '../../../../core/models/dashboard.model';
import { AppHeader } from '../../../../shared/components/app-header/app-header';
import { staggerReveal } from '../../../../shared/animations/motion';
import { DashboardService } from '../../services/dashboard.service';
import { ClassCards } from '../../dashboard/components/class-cards/class-cards';

@Component({
  selector: 'app-classes-page',
  imports: [AppHeader, ClassCards],
  templateUrl: './classes-page.html',
  styleUrl: './classes-page.scss',
})
export class ClassesPage {
  private readonly dashboardService = inject(DashboardService);

  readonly breakdown = signal<ClassBreakdown[]>([]);

  constructor() {
    this.dashboardService.getClassBreakdown().subscribe((breakdown) => {
      this.breakdown.set(breakdown);
      setTimeout(() => staggerReveal(document.querySelectorAll('.class-cards-grid > *')), 0);
    });
  }
}
