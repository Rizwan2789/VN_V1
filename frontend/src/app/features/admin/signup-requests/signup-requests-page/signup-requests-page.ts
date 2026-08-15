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

import { Batch } from '../../../../core/models/batch.model';
import { SignupRequest } from '../../../../core/models/signup-request.model';
import { AppHeader } from '../../../../shared/components/app-header/app-header';
import { CredentialsDialog, CredentialsField } from '../../../../shared/components/credentials-dialog/credentials-dialog';
import { BatchService } from '../../../coordinator/services/batch.service';
import { SignupRequestService } from '../../../../core/services/signup-request.service';
import {
  SignupRequestApproveDialog,
  SignupRequestApproveDialogData,
} from '../signup-request-approve-dialog/signup-request-approve-dialog';

const STATUS_OPTIONS = ['PENDING', 'APPROVED', 'REJECTED'] as const;

@Component({
  selector: 'app-signup-requests-page',
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
  templateUrl: './signup-requests-page.html',
  styleUrl: './signup-requests-page.scss',
})
export class SignupRequestsPage {
  private readonly signupRequestService = inject(SignupRequestService);
  private readonly batchService = inject(BatchService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly requests = signal<SignupRequest[]>([]);
  readonly batches = signal<Batch[]>([]);
  readonly loading = signal(true);

  readonly statusOptions = STATUS_OPTIONS;
  readonly displayedColumns = ['full_name', 'email', 'requested_batch', 'status', 'created_at', 'actions'];

  statusFilter: string | null = 'PENDING';

  constructor() {
    // listPublic(), not list() — GET /api/batches requires coordinator/student
    // role and 403s for admin; listPublic() has no role restriction and
    // returns the same data (built originally for the anonymous signup page).
    this.batchService.listPublic().subscribe((batches) => this.batches.set(batches));
    this.loadRequests();
  }

  private loadRequests(): void {
    this.loading.set(true);
    this.signupRequestService.list({ status: this.statusFilter ?? undefined, pageSize: 100 }).subscribe({
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

  approve(request: SignupRequest): void {
    const ref = this.dialog.open<SignupRequestApproveDialog, SignupRequestApproveDialogData>(
      SignupRequestApproveDialog,
      { width: '480px', data: { request, batches: this.batches() } },
    );

    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.signupRequestService.approve(request.id, result).subscribe({
        next: (created) => {
          const fields: CredentialsField[] = [{ label: 'Roll Number', value: created.student.roll_no }];
          if (created.student.email) fields.push({ label: 'Email', value: created.student.email });
          fields.push({ label: 'Temporary Password', value: created.temporary_password });

          this.dialog.open(CredentialsDialog, {
            width: '460px',
            data: {
              title: 'Account Created',
              subtitle: `Credentials for ${created.student.full_name}`,
              fields,
            },
          });
          this.loadRequests();
        },
        error: (err) => {
          this.snackBar.open(err?.error?.detail ?? 'Could not approve this application.', 'Dismiss', {
            duration: 5000,
          });
        },
      });
    });
  }

  reject(request: SignupRequest): void {
    const reason = prompt(`Reject the application from ${request.full_name}? Optional reason:`);
    if (reason === null) return;

    this.signupRequestService.reject(request.id, reason || undefined).subscribe({
      next: () => {
        this.snackBar.open('Application rejected.', 'Dismiss', { duration: 4000 });
        this.loadRequests();
      },
      error: () => {
        this.snackBar.open('Could not reject this application.', 'Dismiss', { duration: 5000 });
      },
    });
  }
}
