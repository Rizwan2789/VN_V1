import { Component, Input, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { FeeRecordWithPayments, MonthSelection } from '../../../../core/models/fee-record.model';
import { Student } from '../../../../core/models/student.model';
import { AppHeader } from '../../../../shared/components/app-header/app-header';
import { FeeMonthDetail, ReceiptDownload } from '../../../../shared/components/fee-month-detail/fee-month-detail';
import { FeeTimeline } from '../../../../shared/components/fee-timeline/fee-timeline';
import { FeeCalendarGrid } from '../../../student/portal/components/fee-calendar-grid/fee-calendar-grid';
import { StudentHeader } from '../../../student/portal/components/student-header/student-header';
import { FeeService } from '../../services/fee.service';
import { StudentService } from '../../services/student.service';

/**
 * Replaces the old fee-collection-dialog (a cramped modal with a plain
 * table) — reuses the exact same fee-timeline/fee-calendar-grid/
 * fee-month-detail components the student portal uses, so both roles see
 * the same visual pattern for what's conceptually the same data. Only the
 * payment-recording form (projected into fee-month-detail's detail-actions
 * slot) is coordinator-only.
 */
@Component({
  selector: 'app-student-fee-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    AppHeader,
    StudentHeader,
    FeeTimeline,
    FeeCalendarGrid,
    FeeMonthDetail,
  ],
  templateUrl: './student-fee-page.html',
  styleUrl: './student-fee-page.scss',
})
export class StudentFeePage {
  @Input({ required: true }) id!: string; // route param — bound as a string

  private readonly studentService = inject(StudentService);
  private readonly feeService = inject(FeeService);
  private readonly fb = inject(FormBuilder);

  readonly student = signal<Student | null>(null);
  readonly fees = signal<FeeRecordWithPayments[]>([]);
  readonly loading = signal(true);
  readonly year = signal(new Date().getFullYear());
  readonly selection = signal<MonthSelection | null>(null);
  readonly recordingPayment = signal(false);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly paymentForm = this.fb.group({
    amount: ['', [Validators.required, Validators.min(1)]],
    payment_method: [''],
    transaction_notes: [''],
  });

  private get studentId(): number {
    return Number(this.id);
  }

  constructor() {
    this.studentService.get(this.studentId).subscribe((student) => this.student.set(student));
    this.loadFees();
  }

  private loadFees(): void {
    this.loading.set(true);
    this.studentService.getFees(this.studentId, this.year()).subscribe({
      next: (fees) => {
        this.fees.set(fees);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onYearChange(year: number): void {
    this.year.set(year);
    this.selection.set(null);
    this.recordingPayment.set(false);
    this.loadFees();
  }

  onMonthSelected(selection: MonthSelection): void {
    this.selection.set(selection);
    this.recordingPayment.set(false);
  }

  get hasCurrentMonthRecord(): boolean {
    const today = new Date();
    if (this.year() !== today.getFullYear()) return true; // hide the generate button when viewing another year
    return this.fees().some((r) => r.period_month === today.getMonth() + 1);
  }

  generateCurrentMonth(): void {
    const today = new Date();
    this.feeService.generate(today.getMonth() + 1, today.getFullYear()).subscribe(() => this.loadFees());
  }

  startPayment(): void {
    this.recordingPayment.set(true);
    this.paymentForm.reset({ amount: '', payment_method: '', transaction_notes: '' });
    this.errorMessage.set(null);
  }

  cancelPayment(): void {
    this.recordingPayment.set(false);
  }

  submitPayment(): void {
    const recordId = this.selection()?.record?.id;
    if (recordId == null || this.paymentForm.invalid) {
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
          this.recordingPayment.set(false);
          this.loadFees();
        },
        error: () => {
          this.submitting.set(false);
          this.errorMessage.set('Could not record payment. Please try again.');
        },
      });
  }

  downloadReceipt(event: ReceiptDownload): void {
    this.studentService.downloadReceipt(event.paymentId, event.receiptNumber);
  }
}
