import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { PasswordResetRequest } from '../../../../core/models/password-reset-request.model';
import { AppHeader } from '../../../../shared/components/app-header/app-header';
import { CredentialsDialog, CredentialsField } from '../../../../shared/components/credentials-dialog/credentials-dialog';
import { PasswordResetRequestService } from '../../../../core/services/password-reset-request.service';

const STATUS_OPTIONS = ['PENDING', 'APPROVED', 'REJECTED'] as const;

@Component({
  selector: 'app-password-reset-requests-page',
  imports: [
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
    AppHeader,
  ],
  templateUrl: './password-reset-requests-page.html',
  styleUrl: './password-reset-requests-page.scss',
})
export class PasswordResetRequestsPage {
  private readonly resetRequestService = inject(PasswordResetRequestService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly requests = signal<PasswordResetRequest[]>([]);
  readonly loading = signal(true);

  readonly statusOptions = STATUS_OPTIONS;
  readonly displayedColumns = ['full_name', 'login_id', 'requested_role', 'status', 'created_at', 'actions'];

  statusFilter: string | null = 'PENDING';

  constructor() {
    this.loadRequests();
  }

  private loadRequests(): void {
    this.loading.set(true);
    this.resetRequestService.list({ status: this.statusFilter ?? undefined, pageSize: 100 }).subscribe({
      next: (res) => {
        this.requests.set(res.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onStatusFilterChange(status: string | null): void {
    this.statusFilter = status;
    this.loadRequests();
  }

  approve(request: PasswordResetRequest): void {
    if (!confirm(`Approve the password reset for ${request.full_name}? A new temporary password will be generated.`)) {
      return;
    }

    this.resetRequestService.approve(request.id).subscribe({
      next: (res) => {
        const fields: CredentialsField[] = [
          { label: 'Login ID', value: request.login_id },
          { label: 'Temporary Password', value: res.temporary_password },
        ];

        this.dialog.open(CredentialsDialog, {
          width: '460px',
          data: {
            title: 'Password Reset',
            subtitle: `New credentials for ${request.full_name}`,
            fields,
            sendEmail: request.email
              ? {
                  recipientEmail: request.email,
                  action: () => this.resetRequestService.sendCredentialsEmail(request.id, res.temporary_password),
                }
              : undefined,
          },
        });
        this.loadRequests();
      },
      error: () => {
        this.snackBar.open('Could not approve this request.', 'Dismiss', { duration: 5000 });
      },
    });
  }

  reject(request: PasswordResetRequest): void {
    const reason = prompt(`Reject the password reset request for ${request.full_name}? Optional reason:`);
    if (reason === null) return;

    this.resetRequestService.reject(request.id, reason || undefined).subscribe({
      next: () => {
        this.snackBar.open('Request rejected.', 'Dismiss', { duration: 4000 });
        this.loadRequests();
      },
      error: () => {
        this.snackBar.open('Could not reject this request.', 'Dismiss', { duration: 5000 });
      },
    });
  }
}
