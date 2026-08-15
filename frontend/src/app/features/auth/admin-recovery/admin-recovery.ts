import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { AdminRecoveryService } from '../../../core/services/admin-recovery.service';
import { Logo } from '../../../shared/components/logo/logo';
import { HoverLiftDirective } from '../../../shared/directives/hover-lift.directive';

type Step = 'login-id' | 'answer' | 'success';

/**
 * Admin-only recovery: a security question instead of an approval queue —
 * there's no one above admin to route a request to. A routed page (not a
 * dialog) since it's multi-step and should survive a refresh mid-flow.
 */
@Component({
  selector: 'app-admin-recovery',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    Logo,
    HoverLiftDirective,
  ],
  templateUrl: './admin-recovery.html',
  styleUrl: './admin-recovery.scss',
})
export class AdminRecovery {
  private readonly fb = inject(FormBuilder);
  private readonly recoveryService = inject(AdminRecoveryService);

  readonly step = signal<Step>('login-id');
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly questionText = signal<string | null>(null);

  private challengeToken = '';

  readonly startForm = this.fb.group({
    loginId: ['', Validators.required],
  });

  readonly answerForm = this.fb.group({
    answer: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });

  submitStart(): void {
    if (this.startForm.invalid) {
      this.startForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    const loginId = this.startForm.getRawValue().loginId!.trim();

    this.recoveryService.start(loginId).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        this.challengeToken = response.challenge_token;
        this.questionText.set(response.question_text);
        this.step.set('answer');
      },
      error: () => {
        this.isSubmitting.set(false);
        this.errorMessage.set('Something went wrong. Please try again.');
      },
    });
  }

  submitAnswer(): void {
    if (this.answerForm.invalid) {
      this.answerForm.markAllAsTouched();
      return;
    }

    const { answer, newPassword, confirmPassword } = this.answerForm.getRawValue();
    if (newPassword !== confirmPassword) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.recoveryService.verify(this.challengeToken, answer!, newPassword!).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.step.set('success');
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const detail: string | undefined = err?.error?.detail;
        this.errorMessage.set(detail ?? 'Something went wrong. Please try again.');
        // A 401 means the challenge itself is dead (expired/exhausted) — the
        // only way forward is starting over with a freshly-picked question.
        if (err?.status === 401) {
          this.restart();
        }
      },
    });
  }

  restart(): void {
    this.challengeToken = '';
    this.questionText.set(null);
    this.errorMessage.set(null);
    this.answerForm.reset();
    this.step.set('login-id');
  }
}
