import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface CredentialsField {
  label: string;
  value: string;
}

export interface CredentialsDialogData {
  title: string;
  subtitle?: string;
  fields: CredentialsField[];
}

/**
 * Shows freshly-generated login credentials (roll number/login id, email,
 * temporary password) prominently with per-field copy buttons plus a
 * copy-all — used everywhere the app hands out a one-time password that
 * won't be shown again (admin resets, signup approval, reset approval).
 */
@Component({
  selector: 'app-credentials-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIconModule, MatTooltipModule],
  templateUrl: './credentials-dialog.html',
  styleUrl: './credentials-dialog.scss',
})
export class CredentialsDialog {
  protected readonly data = inject<CredentialsDialogData>(MAT_DIALOG_DATA);

  readonly copiedField = signal<string | null>(null);
  readonly copiedAll = signal(false);

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
}
