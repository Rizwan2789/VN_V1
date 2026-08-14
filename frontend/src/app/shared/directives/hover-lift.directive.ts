import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import gsap from 'gsap';

import { prefersReducedMotion } from '../animations/motion';


@Directive({
  selector: '[appHoverLift]',
})
export class HoverLiftDirective {
  private readonly el = inject(ElementRef<HTMLElement>);

  @HostListener('mouseenter')
  @HostListener('focusin')
  onEnter(): void {
    if (prefersReducedMotion()) return;
    gsap.to(this.el.nativeElement, { y: -4, duration: 0.2, ease: 'power2.out' });
  }

  @HostListener('mouseleave')
  @HostListener('focusout')
  onLeave(): void {
    if (prefersReducedMotion()) return;
    gsap.to(this.el.nativeElement, { y: 0, duration: 0.2, ease: 'power2.out' });
  }
}
