import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';

import { FeeRecord } from '../../../../core/models/fee-record.model';
import { StudentListItem } from '../../../../core/models/student.model';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { FeeService } from '../../services/fee.service';
import { StudentService } from '../../services/student.service';

export interface FeeCollectionDialogData {
  student: StudentListItem;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

@Component({
  selector: 'app-fee-collection-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTableModule,
    StatusBadge,
  ],
  templateUrl: './fee-collection-dialog.html',
  styleUrl: './fee-collection-dialog.scss',
})
export class FeeCollectionDialog {
  protected readonly data = inject<FeeCollectionDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<FeeCollectionDialog>);
  private readonly studentService = inject(StudentService);
  private readonly feeService = inject(FeeService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(true);
  readonly records = signal<FeeRecord[]>([]);
  readonly selectedRecordId = signal<number | null>(null);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly displayedColumns = ['period', 'amount_due', 'amount_paid', 'status', 'due_date', 'actions'];

  readonly paymentForm = this.fb.group({
    amount: ['', [Validators.required, Validators.min(1)]],
    payment_method: [''],
    transaction_notes: [''],
  });

  constructor() {
    this.loadFees();
  }

  private loadFees(): void {
    this.loading.set(true);
    this.studentService.getFees(this.data.student.id).subscribe({
      next: (records) => {
        this.records.set(records);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  monthLabel(record: FeeRecord): string {
    return `${MONTH_NAMES[record.period_month - 1]} ${record.period_year}`;
  }

  get hasCurrentMonthRecord(): boolean {
    const today = new Date();
    return this.records().some(
      (r) => r.period_month === today.getMonth() + 1 && r.period_year === today.getFullYear(),
    );
  }

  generateCurrentMonth(): void {
    const today = new Date();
    this.feeService.generate(today.getMonth() + 1, today.getFullYear()).subscribe(() => this.loadFees());
  }

  startPayment(record: FeeRecord): void {
    this.selectedRecordId.set(record.id);
    this.paymentForm.reset({ amount: '', payment_method: '', transaction_notes: '' });
    this.errorMessage.set(null);
  }

  cancelPayment(): void {
    this.selectedRecordId.set(null);
  }

  submitPayment(): void {
    const recordId = this.selectedRecordId();
    if (recordId === null || this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    const raw = this.paymentForm.getRawValue();
    this.submitting.set(true);
    this.errorMessage.set(null);

    this.feeService
      .recordPayment(recordId, {
        amount: Number(raw.amount),
        payment_method: raw.payment_method || undefined,
        transaction_notes: raw.transaction_notes || undefined,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.selectedRecordId.set(null);
          this.loadFees();
        },
        error: () => {
          this.submitting.set(false);
          this.errorMessage.set('Could not record payment. Please try again.');
        },
      });
  }

  close(): void {
    this.dialogRef.close();
  }
}
