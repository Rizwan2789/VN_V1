import { Injectable, signal } from '@angular/core';

/** Coordinates the coordinator shell's mobile drawer from app-header's hamburger button, which lives several component layers away from the shell that owns the sidenav. */
@Injectable({ providedIn: 'root' })
export class SidenavService {
  readonly isOpen = signal(false);

  toggle(): void {
    this.isOpen.update((value) => !value);
  }

  close(): void {
    this.isOpen.set(false);
  }
}
