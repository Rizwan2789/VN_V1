import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { map } from 'rxjs';

import { SidenavService } from '../../../shared/services/sidenav.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

const MOBILE_BREAKPOINT = '(max-width: 900px)';

/**
 * Wraps every coordinator route (Dashboard/Students/Classes + their detail
 * pages) with a persistent left sidenav — previously there was no shell at
 * all, just a per-page topbar with no cross-page navigation affordance.
 * Below 900px the sidenav becomes an off-canvas drawer toggled from
 * app-header's hamburger button via SidenavService.
 */
@Component({
  selector: 'app-coordinator-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, MatIconModule, MatListModule, MatSidenavModule],
  templateUrl: './coordinator-shell.html',
  styleUrl: './coordinator-shell.scss',
})
export class CoordinatorShell {
  protected readonly sidenavService = inject(SidenavService);
  private readonly breakpointObserver = inject(BreakpointObserver);

  protected readonly isMobile = toSignal(
    this.breakpointObserver.observe(MOBILE_BREAKPOINT).pipe(map((state) => state.matches)),
    { initialValue: false },
  );

  protected readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/coordinator/dashboard' },
    { label: 'Students', icon: 'groups', route: '/coordinator/students' },
    { label: 'Classes', icon: 'school', route: '/coordinator/classes' },
  ];

  closeIfMobile(): void {
    if (this.isMobile()) this.sidenavService.close();
  }
}
