import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { Batch } from '../../../../core/models/batch.model';
import { Student, StudentCreate, StudentUpdate } from '../../../../core/models/student.model';

export interface StudentFormDialogData {
  mode: 'create' | 'edit';
  batches: Batch[];
  student?: Student;
}

@Component({
  selector: 'app-student-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './student-form-dialog.html',
  styleUrl: './student-form-dialog.scss',
})
export class StudentFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<StudentFormDialog>);
  protected readonly data = inject<StudentFormDialogData>(MAT_DIALOG_DATA);

  readonly isEdit = this.data.mode === 'edit';

  readonly form = this.fb.group({
    full_name: [this.data.student?.full_name ?? '', Validators.required],
    roll_no: [
      { value: this.data.student?.roll_no ?? '', disabled: this.isEdit },
      Validators.required,
    ],
    batch_id: [this.data.student?.batch.id ?? this.data.batches[0]?.id ?? null, Validators.required],
    email: [this.data.student?.email ?? ''],
    phone: [this.data.student?.phone ?? ''],
    guardian_name: [this.data.student?.guardian_name ?? ''],
    guardian_phone: [this.data.student?.guardian_phone ?? ''],
    address: [this.data.student?.address ?? ''],
    monthly_fee_amount: [this.data.student?.monthly_fee_amount ?? '', [Validators.required, Validators.min(1)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const base = {
      full_name: raw.full_name!,
      batch_id: raw.batch_id!,
      email: raw.email || undefined,
      phone: raw.phone || undefined,
      guardian_name: raw.guardian_name || undefined,
      guardian_phone: raw.guardian_phone || undefined,
      address: raw.address || undefined,
      monthly_fee_amount: Number(raw.monthly_fee_amount),
    };

    if (this.isEdit) {
      this.dialogRef.close(base as StudentUpdate);
    } else {
      this.dialogRef.close({ ...base, roll_no: raw.roll_no! } as StudentCreate);
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
