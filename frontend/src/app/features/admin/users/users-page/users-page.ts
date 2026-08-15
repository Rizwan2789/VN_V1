import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { AdminUserListItem } from '../../../../core/models/admin.model';
import { AppHeader } from '../../../../shared/components/app-header/app-header';
import { CredentialsDialog, CredentialsField } from '../../../../shared/components/credentials-dialog/credentials-dialog';
import { AdminService } from '../../services/admin.service';

const ROLE_OPTIONS = ['coordinator', 'student'] as const;

@Component({
  selector: 'app-users-page',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
    AppHeader,
  ],
  templateUrl: './users-page.html',
  styleUrl: './users-page.scss',
})
export class UsersPage {
  private readonly adminService = inject(AdminService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly users = signal<AdminUserListItem[]>([]);
  readonly loading = signal(true);

  readonly roleOptions = ROLE_OPTIONS;
  readonly displayedColumns = ['full_name', 'login_id', 'email', 'role', 'is_active', 'actions'];

  searchTerm = '';
  roleFilter: string | null = null;

  private readonly searchTermChanges = new Subject<string>();

  constructor() {
    this.loadUsers();

    this.searchTermChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe((term) => {
      this.searchTerm = term;
      this.loadUsers();
    });
  }

  private loadUsers(): void {
    this.loading.set(true);
    this.adminService
      .listUsers({ role: this.roleFilter ?? undefined, search: this.searchTerm || undefined, pageSize: 100 })
      .subscribe({
        next: (res) => {
          this.users.set(res.items);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onSearchTermChange(term: string): void {
    this.searchTermChanges.next(term);
  }

  onRoleFilterChange(role: string | null): void {
    this.roleFilter = role;
    this.loadUsers();
  }

  resetPassword(user: AdminUserListItem): void {
    if (!confirm(`Reset password for ${user.full_name}? A new temporary password will be generated.`)) return;

    this.adminService.resetUserPassword(user.id).subscribe((res) => {
      const fields: CredentialsField[] = [{ label: 'Login ID', value: user.login_id }];
      if (user.email) fields.push({ label: 'Email', value: user.email });
      fields.push({ label: 'Temporary Password', value: res.temporary_password });

      this.dialog.open(CredentialsDialog, {
        width: '460px',
        data: { title: 'Password Reset', subtitle: `New credentials for ${user.full_name}`, fields },
      });
    });
  }

  deactivate(user: AdminUserListItem): void {
    if (!confirm(`Deactivate ${user.full_name}? They will no longer be able to log in.`)) return;

    this.adminService.deactivateUser(user.id).subscribe({
      next: () => {
        this.snackBar.open(`${user.full_name} deactivated.`, 'Dismiss', { duration: 4000 });
        this.loadUsers();
      },
      error: () => {
        this.snackBar.open('Could not deactivate this user.', 'Dismiss', { duration: 5000 });
      },
    });
  }
}
