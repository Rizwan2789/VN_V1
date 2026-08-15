import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable } from 'rxjs';

export interface CredentialsField {
  label: string;
  value: string;
}

export interface CredentialsSendEmail {
  /** Shown in the button/status text, e.g. the recipient's address. */
  recipientEmail: string;
  /** Fires the actual send; dialog tracks sending/sent/error state around it. */
  action: () => Observable<unknown>;
}

export interface CredentialsDialogData {
  title: string;
  subtitle?: string;
  fields: CredentialsField[];
  /** When present, shows a "Send Email" button so the admin reviews the
   * generated credentials before they go out, instead of them being
   * emailed automatically. */
  sendEmail?: CredentialsSendEmail;
}

/**
 * Shows freshly-generated login credentials (roll number/login id, email,
 * temporary password) prominently with per-field copy buttons plus a
 * copy-all — used everywhere the app hands out a one-time password that
 * won't be shown again (admin resets, signup approval, reset approval).
 */
@Component({
  selector: 'app-credentials-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule],
  templateUrl: './credentials-dialog.html',
  styleUrl: './credentials-dialog.scss',
})
export class CredentialsDialog {
  protected readonly data = inject<CredentialsDialogData>(MAT_DIALOG_DATA);

  readonly copiedField = signal<string | null>(null);
  readonly copiedAll = signal(false);

  readonly sending = signal(false);
  readonly sent = signal(false);
  readonly sendError = signal<string | null>(null);

  copyField(field: CredentialsField): void {
    navigator.clipboard.writeText(field.value).then(() => {
      this.copiedField.set(field.label);
      setTimeout(() => this.copiedField.set(null), 1500);
    });
  }

  copyAll(): void {
    const text = this.data.fields.map((f) => `${f.label}: ${f.value}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      this.copiedAll.set(true);
      setTimeout(() => this.copiedAll.set(false), 1500);
    });
  }

  sendEmail(): void {
    const config = this.data.sendEmail;
    if (!config || this.sending() || this.sent()) return;

    this.sending.set(true);
    this.sendError.set(null);
    config.action().subscribe({
      next: () => {
        this.sending.set(false);
        this.sent.set(true);
      },
      error: () => {
        this.sending.set(false);
        this.sendError.set('Could not send the email. Please try again.');
      },
    });
  }
}
