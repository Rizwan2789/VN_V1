import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { map } from 'rxjs';

import { SidenavService } from '../../../shared/services/sidenav.service';
import { Logo } from '../../../shared/components/logo/logo';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

const MOBILE_BREAKPOINT = '(max-width: 900px)';

/**
 * Direct copy of CoordinatorShell's pattern — persistent left sidenav,
 * off-canvas below 900px. Admin's scope is deliberately narrower than
 * Coordinator's (user accounts + approval queues, not fee operations),
 * which is why the nav item list below has no Fees/Payments/Classes.
 */
@Component({
  selector: 'app-admin-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, MatIconModule, MatListModule, MatSidenavModule, Logo],
  templateUrl: './admin-shell.html',
  styleUrl: './admin-shell.scss',
})
export class AdminShell {
  protected readonly sidenavService = inject(SidenavService);
  private readonly breakpointObserver = inject(BreakpointObserver);

  protected readonly isMobile = toSignal(
    this.breakpointObserver.observe(MOBILE_BREAKPOINT).pipe(map((state) => state.matches)),
    { initialValue: false },
  );

  protected readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/admin/dashboard' },
    { label: 'Users', icon: 'manage_accounts', route: '/admin/users' },
    { label: 'Signup Requests', icon: 'person_add', route: '/admin/signup-requests' },
    { label: 'Password Requests', icon: 'lock_reset', route: '/admin/password-reset-requests' },
    { label: 'Security Questions', icon: 'quiz', route: '/admin/security-questions' },
  ];

  closeIfMobile(): void {
    if (this.isMobile()) this.sidenavService.close();
  }
}
