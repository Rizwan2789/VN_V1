import { AfterViewInit, Component, ElementRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { Logo } from '../../../../shared/components/logo/logo';
import { playNavEntrance } from '../../animations/hero.animations';

@Component({
  selector: 'app-nav-header',
  imports: [RouterLink, MatButtonModule, MatIconModule, Logo],
  templateUrl: './nav-header.html',
  styleUrl: './nav-header.scss',
})
export class NavHeader implements AfterViewInit {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  ngAfterViewInit(): void {
    playNavEntrance(this.elementRef.nativeElement);
  }
}
