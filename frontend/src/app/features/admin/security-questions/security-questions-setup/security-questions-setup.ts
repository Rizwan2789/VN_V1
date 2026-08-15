import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { SecurityQuestionStatus } from '../../../../core/models/security-question.model';
import { AppHeader } from '../../../../shared/components/app-header/app-header';
import { AdminService } from '../../services/admin.service';

/**
 * A fresh admin has zero answered questions and can't use the
 * forgot-password recovery flow until this is completed — surfaced as a
 * banner while any of the 5 remain unanswered.
 */
@Component({
  selector: 'app-security-questions-setup',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    AppHeader,
  ],
  templateUrl: './security-questions-setup.html',
  styleUrl: './security-questions-setup.scss',
})
export class SecurityQuestionsSetup {
  private readonly fb = inject(FormBuilder);
  private readonly adminService = inject(AdminService);
  private readonly snackBar = inject(MatSnackBar);

  readonly questions = signal<SecurityQuestionStatus[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);

  readonly form = this.fb.group({});

  constructor() {
    this.loadQuestions();
  }

  private loadQuestions(): void {
    this.loading.set(true);
    this.adminService.getMySecurityQuestions().subscribe((questions) => {
      this.questions.set(questions);
      for (const key of Object.keys(this.form.controls)) this.form.removeControl(key);
      for (const q of questions) {
        this.form.addControl(String(q.id), this.fb.control('', Validators.required));
      }
      this.loading.set(false);
    });
  }

  get allAnswered(): boolean {
    return this.questions().length > 0 && this.questions().every((q) => q.is_answered);
  }

  save(): void {
    const answers = this.questions()
      .map((q) => ({ question_id: q.id, answer: String(this.form.get(String(q.id))?.value ?? '').trim() }))
      .filter((a) => a.answer.length > 0);

    if (answers.length === 0) {
      this.snackBar.open('Enter at least one answer before saving.', 'Dismiss', { duration: 4000 });
      return;
    }

    this.saving.set(true);
    this.adminService.updateMySecurityAnswers(answers).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Security answers saved.', 'Dismiss', { duration: 4000 });
        this.loadQuestions();
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Could not save your answers. Please try again.', 'Dismiss', { duration: 5000 });
      },
    });
  }
}
