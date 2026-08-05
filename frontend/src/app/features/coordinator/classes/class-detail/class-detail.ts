import { Component, Input, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { Batch } from '../../../../core/models/batch.model';
import { ClassBreakdown } from '../../../../core/models/dashboard.model';
import { StudentListItem } from '../../../../core/models/student.model';
import { AppHeader } from '../../../../shared/components/app-header/app-header';
import { BatchService } from '../../services/batch.service';
import { DashboardService } from '../../services/dashboard.service';
import { FeeService } from '../../services/fee.service';
import { StudentService } from '../../services/student.service';
import { StudentFormDialog, StudentFormDialogData } from '../../students/student-form-dialog/student-form-dialog';
import { StudentListTable } from '../../dashboard/components/student-list-table/student-list-table';
import { DefaultersTable } from './components/defaulters-table/defaulters-table';

@Component({
  selector: 'app-class-detail',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, AppHeader, StudentListTable, DefaultersTable],
  templateUrl: './class-detail.html',
  styleUrl: './class-detail.scss',
})
export class ClassDetail {
  @Input({ required: true }) batchId!: string; // route param — bound as a string

  private readonly dashboardService = inject(DashboardService);
  private readonly batchService = inject(BatchService);
  private readonly studentService = inject(StudentService);
  private readonly feeService = inject(FeeService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  readonly breakdown = signal<ClassBreakdown | null>(null);
  readonly breakdownLoading = signal(true);
  readonly batches = signal<Batch[]>([]);
  readonly students = signal<StudentListItem[]>([]);
  readonly studentsLoading = signal(true);
  readonly generating = signal(false);

  searchTerm = '';
  statusFilter: string | null = null;

  private readonly searchTermChanges = new Subject<string>();

  private get id(): number {
    return Number(this.batchId);
  }

  constructor() {
    this.loadBreakdown();
    this.loadStudents();
    this.batchService.list().subscribe((batches) => this.batches.set(batches));

    this.searchTermChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe((term) => {
      this.searchTerm = term;
      this.loadStudents();
    });
  }

  private loadBreakdown(): void {
    this.breakdownLoading.set(true);
    this.dashboardService.getClassBreakdown(this.id).subscribe({
      next: (rows) => {
        this.breakdown.set(rows[0] ?? null);
        this.breakdownLoading.set(false);
      },
      error: () => this.breakdownLoading.set(false),
    });
  }

  private loadStudents(): void {
    this.studentsLoading.set(true);
    this.studentService
      .list({ batchId: this.id, status: this.statusFilter ?? undefined, search: this.searchTerm || undefined })
      .subscribe({
        next: (response) => {
          this.students.set(response.items);
          this.studentsLoading.set(false);
        },
        error: () => this.studentsLoading.set(false),
      });
  }

  private refreshAfterMutation(): void {
    this.loadStudents();
    this.loadBreakdown();
  }

  onSearchTermChange(term: string): void {
    this.searchTermChanges.next(term);
  }

  onStatusFilterChange(status: string | null): void {
    this.statusFilter = status;
    this.loadStudents();
  }

  collectedPercent(): number {
    const item = this.breakdown();
    if (!item) return 0;
    const collected = Number(item.collected_amount);
    const pending = Number(item.pending_amount);
    const total = collected + pending;
    return total > 0 ? Math.round((collected / total) * 100) : 0;
  }

  generateInvoices(): void {
    this.generating.set(true);
    const today = new Date();
    this.feeService.generate(today.getMonth() + 1, today.getFullYear(), this.id).subscribe({
      next: (created) => {
        this.generating.set(false);
        this.snackBar.open(`Generated ${created.length} invoice(s) for this class.`, 'Dismiss', { duration: 5000 });
        this.refreshAfterMutation();
      },
      error: () => {
        this.generating.set(false);
        this.snackBar.open('Could not generate invoices. Please try again.', 'Dismiss', { duration: 5000 });
      },
    });
  }

  openAddStudent(): void {
    // Puts this class first in the dropdown so it's preselected by default.
    const orderedBatches = [
      ...this.batches().filter((b) => b.id === this.id),
      ...this.batches().filter((b) => b.id !== this.id),
    ];

    const ref = this.dialog.open<StudentFormDialog, StudentFormDialogData>(StudentFormDialog, {
      width: '640px',
      data: { mode: 'create', batches: orderedBatches },
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
    this.router.navigate(['/coordinator/students', item.id, 'fees']);
  }

  deactivateStudent(item: StudentListItem): void {
    if (!confirm(`Deactivate ${item.full_name}? They will no longer be able to log in.`)) return;
    this.studentService.deactivate(item.id).subscribe(() => this.refreshAfterMutation());
  }
}
