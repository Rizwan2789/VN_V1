import { AfterViewInit, Component, ElementRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { playHeroEntrance } from '../../animations/hero.animations';

@Component({
  selector: 'app-hero-section',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './hero-section.html',
  styleUrl: './hero-section.scss',
})
export class HeroSection implements AfterViewInit {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  ngAfterViewInit(): void {
    playHeroEntrance(this.elementRef.nativeElement);
  }
}
