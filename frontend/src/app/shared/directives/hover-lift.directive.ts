import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import gsap from 'gsap';

import { prefersReducedMotion } from '../animations/motion';

/**
 * GSAP-tweens a small translateY lift on hover/focus. Deliberately only
 * touches transform — box-shadow/border stay a plain CSS transition on the
 * host (see card.scss), since GSAP's box-shadow string interpolation is
 * unreliable to tween smoothly.
 */
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
