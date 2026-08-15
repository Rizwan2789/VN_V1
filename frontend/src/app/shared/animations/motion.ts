import gsap from 'gsap';

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export interface StaggerRevealOptions {
  y?: number;
  duration?: number;
  stagger?: number;
}

/**
 * Fades + slides a set of elements in on mount, staggered — the on-mount
 * counterpart to the landing page's scroll-triggered `revealOnScroll`
 * (dashboard/class-detail content should animate in immediately, not wait
 * for a scroll position).
 */
export function staggerReveal(elements: Element[] | NodeListOf<Element>, opts?: StaggerRevealOptions): void {
  if (prefersReducedMotion() || elements.length === 0) return;

  gsap.from(elements, {
    y: opts?.y ?? 20,
    opacity: 0,
    duration: opts?.duration ?? 0.5,
    stagger: opts?.stagger ?? 0.06,
    ease: 'power2.out',
  });
}
