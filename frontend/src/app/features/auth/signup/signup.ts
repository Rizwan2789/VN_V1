import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { Batch } from '../../../core/models/batch.model';
import { SignupRequestService } from '../../../core/services/signup-request.service';
import { BatchService } from '../../coordinator/services/batch.service';
import { Logo } from '../../../shared/components/logo/logo';
import { HoverLiftDirective } from '../../../shared/directives/hover-lift.directive';

/**
 * Public self-signup — a prospective student applies here without any
 * account. This only ever creates a pending SignupRequest; a coordinator or
 * admin reviews it, sets the batch + monthly fee (the applicant can't set
 * fees themselves), and approval is what actually creates the account.
 */
@Component({
  selector: 'app-signup',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    Logo,
    HoverLiftDirective,
  ],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class Signup {
  private readonly fb = inject(FormBuilder);
  private readonly batchService = inject(BatchService);
  private readonly signupRequestService = inject(SignupRequestService);

  readonly batches = signal<Batch[]>([]);
  readonly isSubmitting = signal(false);
  readonly submitted = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    full_name: ['', Validators.required],
    requested_batch_id: [null as number | null, Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    guardian_name: [''],
    guardian_phone: [''],
    address: [''],
  });

  constructor() {
    this.batchService.listPublic().subscribe((batches) => this.batches.set(batches));
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.signupRequestService
      .submit({
        full_name: raw.full_name!,
        requested_batch_id: raw.requested_batch_id!,
        email: raw.email!,
        phone: raw.phone || undefined,
        guardian_name: raw.guardian_name || undefined,
        guardian_phone: raw.guardian_phone || undefined,
        address: raw.address || undefined,
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.submitted.set(true);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(
            err?.error?.detail ?? 'Something went wrong submitting your application. Please try again.',
          );
        },
      });
  }
}
