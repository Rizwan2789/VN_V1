import { Component, Input, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { Batch } from '../../../../core/models/batch.model';
import { StudentListItem } from '../../../../core/models/student.model';
import { AppHeader } from '../../../../shared/components/app-header/app-header';
import { BatchService } from '../../services/batch.service';
import { StudentService } from '../../services/student.service';
import { StudentFormDialog, StudentFormDialogData } from '../student-form-dialog/student-form-dialog';
import { StudentListTable } from '../../dashboard/components/student-list-table/student-list-table';

/**
 * The full student roster — extracted from Dashboard (which now only shows
 * KPIs) so "Students" can be its own sidenav destination. The `status`
 * input binds from a `?status=` query param, which is how the dashboard's
 * Pending/Overdue KPI cards deep-link in with a filter pre-applied.
 */
@Component({
  selector: 'app-students-page',
  imports: [AppHeader, StudentListTable],
  templateUrl: './students-page.html',
  styleUrl: './students-page.scss',
})
export class StudentsPage {
  @Input() status?: string;

  private readonly batchService = inject(BatchService);
  private readonly studentService = inject(StudentService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  readonly batches = signal<Batch[]>([]);
  readonly students = signal<StudentListItem[]>([]);
  readonly studentsLoading = signal(true);

  searchTerm = '';
  statusFilter: string | null = null;

  private readonly searchTermChanges = new Subject<string>();

  constructor() {
    this.statusFilter = this.status ?? null;
    this.loadStudents();
    this.batchService.list().subscribe((batches) => this.batches.set(batches));

    this.searchTermChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe((term) => {
      this.searchTerm = term;
      this.loadStudents();
    });
  }

  private loadStudents(): void {
    this.studentsLoading.set(true);
    this.studentService
      .list({ status: this.statusFilter ?? undefined, search: this.searchTerm || undefined })
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
  }

  onSearchTermChange(term: string): void {
    this.searchTermChanges.next(term);
  }

  onStatusFilterChange(status: string | null): void {
    this.statusFilter = status;
    this.loadStudents();
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
    this.router.navigate(['/coordinator/students', item.id, 'fees']);
  }

  deactivateStudent(item: StudentListItem): void {
    if (!confirm(`Deactivate ${item.full_name}? They will no longer be able to log in.`)) return;
    this.studentService.deactivate(item.id).subscribe(() => this.refreshAfterMutation());
  }
}
