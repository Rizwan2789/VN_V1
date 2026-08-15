import { AfterViewInit, Component, ElementRef, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { revealOnScroll } from '../../animations/hero.animations';
import { HoverLiftDirective } from '../../../../shared/directives/hover-lift.directive';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-features-section',
  imports: [MatIconModule, HoverLiftDirective],
  templateUrl: './features-section.html',
  styleUrl: './features-section.scss',
})
export class FeaturesSection implements AfterViewInit {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly features: Feature[] = [
    {
      icon: 'school',
      title: 'Class-by-Class Tracking',
      description:
        'Coordinators see every batch — Pre-9th through 12th — broken down with its own student list and collection status.',
    },
    {
      icon: 'calendar_month',
      title: 'Calendar-Style Fee History',
      description:
        'Every student gets a clear, month-by-month view of their fee history, so there is never any confusion about what is due.',
    },
    {
      icon: 'receipt_long',
      title: 'Instant Digital Receipts',
      description:
        'The moment a payment is recorded, a numbered receipt is generated — downloadable by the student, any time.',
    },
  ];

  ngAfterViewInit(): void {
    const cards = Array.from(this.elementRef.nativeElement.querySelectorAll('.feature-card')) as HTMLElement[];
    revealOnScroll(cards);
  }
}
