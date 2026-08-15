import { Component, Input, inject } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { AuthService } from '../../../core/services/auth.service';
import { SidenavService } from '../../services/sidenav.service';
import { Logo } from '../logo/logo';

@Component({
  selector: 'app-app-header',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './app-header.html',
  styleUrl: './app-header.scss',
})
export class AppHeader {
  @Input({ required: true }) title!: string;
  /** Shows a back button instead of the brand mark — for leaf pages reached by click-through. */
  @Input() showBack = false;
  /** Shows a hamburger button that opens the coordinator shell's mobile drawer — set by the shell's top-level nav pages only. */
  @Input() showMenuToggle = false;

  protected readonly authService = inject(AuthService);
  protected readonly sidenavService = inject(SidenavService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  goBack(): void {
    this.location.back();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  get userInitials(): string {
    const name = this.authService.currentUser()?.fullName ?? '';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  }
}
