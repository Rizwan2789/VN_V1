import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { UserRole } from '../../../../core/models/user.model';
import { PasswordResetRequestService } from '../../../../core/services/password-reset-request.service';

export interface ForgotPasswordRequestDialogData {
  role: 'coordinator' | 'student';
}

const ROLE_FIELD_LABEL: Record<'coordinator' | 'student', string> = {
  coordinator: 'Email',
  student: 'Roll Number',
};

/**
 * Coordinator/student forgot-password: submits a request into the admin's
 * review queue rather than resetting anything directly — there's no email
 * verification loop to self-serve through, so a human (admin) approves it.
 */
@Component({
  selector: 'app-forgot-password-request-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './forgot-password-request-dialog.html',
  styleUrl: './forgot-password-request-dialog.scss',
})
export class ForgotPasswordRequestDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ForgotPasswordRequestDialog>);
  private readonly resetRequestService = inject(PasswordResetRequestService);
  protected readonly data = inject<ForgotPasswordRequestDialogData>(MAT_DIALOG_DATA);

  readonly fieldLabel = ROLE_FIELD_LABEL[this.data.role];
  readonly isSubmitting = signal(false);
  readonly submitted = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    loginId: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    const loginId = this.form.getRawValue().loginId!.trim();
    const role: UserRole = this.data.role;

    this.resetRequestService.submit(role, loginId).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.submitted.set(true);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.errorMessage.set('Something went wrong submitting your request. Please try again.');
      },
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
