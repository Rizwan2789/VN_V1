import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';

import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/user.model';
import { HoverLiftDirective } from '../../../shared/directives/hover-lift.directive';
import { Logo } from '../../../shared/components/logo/logo';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    HoverLiftDirective,
    Logo,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly selectedRole = signal<UserRole>('coordinator');
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly hidePassword = signal(true);

  readonly form = this.fb.group({
    loginId: ['', Validators.required],
    password: ['', Validators.required],
  });

  onRoleTabChange(index: number): void {
    this.selectedRole.set(index === 0 ? 'coordinator' : 'student');
    this.errorMessage.set(null);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { loginId, password } = this.form.getRawValue();
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.selectedRole(), loginId!.trim(), password!).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        this.router.navigate([response.role === 'coordinator' ? '/coordinator/dashboard' : '/student/portal']);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.errorMessage.set('Invalid credentials for the selected role. Please try again.');
      },
    });
  }
}
