import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';

import { AuthService } from '../../../core/services/auth.service';
import { ROLE_HOME_ROUTE, UserRole } from '../../../core/models/user.model';
import { HoverLiftDirective } from '../../../shared/directives/hover-lift.directive';
import { Logo } from '../../../shared/components/logo/logo';
import { ForgotPasswordRequestDialog } from '../forgot-password/forgot-password-request-dialog/forgot-password-request-dialog';

const TAB_ROLES: UserRole[] = ['coordinator', 'student', 'admin'];

const ROLE_LOGIN_FIELD: Record<UserRole, { label: string; icon: string }> = {
  coordinator: { label: 'Email', icon: 'mail' },
  student: { label: 'Roll Number', icon: 'badge' },
  admin: { label: 'Email', icon: 'mail' },
};

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
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
  private readonly dialog = inject(MatDialog);

  readonly selectedRole = signal<UserRole>('coordinator');
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly hidePassword = signal(true);

  readonly roleLoginField = ROLE_LOGIN_FIELD;

  readonly form = this.fb.group({
    loginId: ['', Validators.required],
    password: ['', Validators.required],
  });

  onRoleTabChange(index: number): void {
    this.selectedRole.set(TAB_ROLES[index]);
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
        this.router.navigate([ROLE_HOME_ROUTE[response.role]]);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.errorMessage.set('Invalid credentials for the selected role. Please try again.');
      },
    });
  }

  openForgotPassword(): void {
    const role = this.selectedRole();
    if (role === 'admin') {
      this.router.navigate(['/admin-recovery']);
      return;
    }
    this.dialog.open(ForgotPasswordRequestDialog, { width: '440px', data: { role } });
  }
}
