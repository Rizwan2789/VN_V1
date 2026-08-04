import { Component, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { Batch } from '../../../core/models/batch.model';
import { DashboardMetrics } from '../../../core/models/dashboard.model';
import { StudentListItem } from '../../../core/models/student.model';
import { AppHeader } from '../../../shared/components/app-header/app-header';
import {
  FeeCollectionDialog,
  FeeCollectionDialogData,
} from '../fees/fee-collection-dialog/fee-collection-dialog';
import { BatchService } from '../services/batch.service';
import { DashboardService } from '../services/dashboard.service';
import { StudentService } from '../services/student.service';
import {
  StudentFormDialog,
  StudentFormDialogData,
} from '../students/student-form-dialog/student-form-dialog';
import { ClassTabs } from './components/class-tabs/class-tabs';
import { MetricsHeader } from './components/metrics-header/metrics-header';
import { StudentListTable } from './components/student-list-table/student-list-table';

@Component({
  selector: 'app-dashboard',
  imports: [AppHeader, MetricsHeader, ClassTabs, StudentListTable],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly dashboardService = inject(DashboardService);
  private readonly batchService = inject(BatchService);
  private readonly studentService = inject(StudentService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly metrics = signal<DashboardMetrics | null>(null);
  readonly batches = signal<Batch[]>([]);
  readonly students = signal<StudentListItem[]>([]);
  readonly studentsLoading = signal(true);

  selectedBatchId: number | null = null;
  searchTerm = '';
  statusFilter: string | null = null;

  private readonly searchTermChanges = new Subject<string>();

  constructor() {
    this.loadMetrics();
    this.searchTermChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe((term) => {
      this.searchTerm = term;
      this.loadStudents();
    });

    this.batchService.list().subscribe((batches) => {
      this.batches.set(batches);
      if (batches.length > 0) {
        this.selectedBatchId = batches[0].id;
        this.loadStudents();
      } else {
        this.studentsLoading.set(false);
      }
    });
  }

  private loadMetrics(): void {
    this.dashboardService.getMetrics().subscribe((metrics) => this.metrics.set(metrics));
  }

  private loadStudents(): void {
    this.studentsLoading.set(true);
    this.studentService
      .list({
        batchId: this.selectedBatchId ?? undefined,
        status: this.statusFilter ?? undefined,
        search: this.searchTerm || undefined,
      })
      .subscribe({
        next: (response) => {
          this.students.set(response.items);
          this.studentsLoading.set(false);
        },
        error: () => this.studentsLoading.set(false),
      });
  }

  onBatchSelected(batchId: number): void {
    this.selectedBatchId = batchId;
    this.loadStudents();
  }

  onSearchTermChange(term: string): void {
    this.searchTermChanges.next(term);
  }

  onStatusFilterChange(status: string | null): void {
    this.statusFilter = status;
    this.loadStudents();
  }

  private refreshAfterMutation(): void {
    this.loadStudents();
    this.loadMetrics();
  }

  openAddStudent(): void {
    const ref = this.dialog.open<StudentFormDialog, StudentFormDialogData>(StudentFormDialog, {
      width: '640px',
      data: { mode: 'create', batches: this.batches() },
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.studentService.create(result).subscribe({
        next: (created) => {
          this.snackBar.open(
            `Student created. Login: ${created.student.roll_no} / Temp password: ${created.temporary_password}`,
            'Dismiss',
            { duration: 10000 },
          );
          this.refreshAfterMutation();
        },
        error: (err) => {
          this.snackBar.open(err?.error?.detail ?? 'Could not create student.', 'Dismiss', { duration: 5000 });
        },
      });
    });
  }

  editStudent(item: StudentListItem): void {
    this.studentService.get(item.id).subscribe((student) => {
      const ref = this.dialog.open<StudentFormDialog, StudentFormDialogData>(StudentFormDialog, {
        width: '640px',
        data: { mode: 'edit', batches: this.batches(), student },
      });

      ref.afterClosed().subscribe((result) => {
        if (!result) return;
        this.studentService.update(item.id, result).subscribe({
          next: () => {
            this.snackBar.open('Student profile updated.', 'Dismiss', { duration: 4000 });
            this.refreshAfterMutation();
          },
          error: () => {
            this.snackBar.open('Could not update student.', 'Dismiss', { duration: 5000 });
          },
        });
      });
    });
  }

  manageFees(item: StudentListItem): void {
    const ref = this.dialog.open<FeeCollectionDialog, FeeCollectionDialogData>(FeeCollectionDialog, {
      width: '760px',
      data: { student: item },
    });
    ref.afterClosed().subscribe(() => this.refreshAfterMutation());
  }

  deactivateStudent(item: StudentListItem): void {
    if (!confirm(`Deactivate ${item.full_name}? They will no longer be able to log in.`)) return;
    this.studentService.deactivate(item.id).subscribe(() => this.refreshAfterMutation());
  }
}
