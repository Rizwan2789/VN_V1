import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { Batch } from '../../../../core/models/batch.model';
import { SignupRequest, SignupRequestApprove } from '../../../../core/models/signup-request.model';

export interface SignupRequestApproveDialogData {
  request: SignupRequest;
  batches: Batch[];
}

/**
 * The only two things a reviewer sets when approving a signup — the batch
 * (pre-filled from the applicant's own pick, but overridable) and the
 * monthly fee, which the applicant can't set themselves.
 */
@Component({
  selector: 'app-signup-request-approve-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './signup-request-approve-dialog.html',
  styleUrl: './signup-request-approve-dialog.scss',
})
export class SignupRequestApproveDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<SignupRequestApproveDialog>);
  protected readonly data = inject<SignupRequestApproveDialogData>(MAT_DIALOG_DATA);

  readonly form = this.fb.group({
    batch_id: [this.data.request.requested_batch.id, Validators.required],
    monthly_fee_amount: ['', [Validators.required, Validators.min(1)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: SignupRequestApprove = {
      batch_id: raw.batch_id!,
      monthly_fee_amount: Number(raw.monthly_fee_amount),
    };
    this.dialogRef.close(payload);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
