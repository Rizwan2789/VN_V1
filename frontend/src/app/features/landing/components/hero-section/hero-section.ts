import { AfterViewInit, Component, ElementRef, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { animateCounters, playHeroEntrance, playHeroVisualParallax } from '../../animations/hero.animations';

@Component({
  selector: 'app-hero-section',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './hero-section.html',
  styleUrl: './hero-section.scss',
})
export class HeroSection implements AfterViewInit {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  ngAfterViewInit(): void {
    const el = this.elementRef.nativeElement;

    playHeroEntrance(el);
    playHeroVisualParallax(el);
    animateCounters(Array.from(el.querySelectorAll('.hero-stat-value')) as HTMLElement[]);
  }
}
