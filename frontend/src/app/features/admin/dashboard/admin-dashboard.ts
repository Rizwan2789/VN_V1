import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { AdminDashboardCounts } from '../../../core/models/admin.model';
import { AppHeader } from '../../../shared/components/app-header/app-header';
import { Card } from '../../../shared/components/card/card';
import { AdminService } from '../services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [MatIconModule, AppHeader, Card],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
})
export class AdminDashboard {
  private readonly adminService = inject(AdminService);

  readonly counts = signal<AdminDashboardCounts | null>(null);

  constructor() {
    this.adminService.getDashboard().subscribe((counts) => this.counts.set(counts));
  }
}
