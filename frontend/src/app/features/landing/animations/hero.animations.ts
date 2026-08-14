import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function playHeroEntrance(container: HTMLElement): void {
  if (prefersReducedMotion()) return;

  const badge = container.querySelector('.hero-badge');
  const heading = container.querySelector('.hero-heading');
  const subheading = container.querySelector('.hero-subheading');
  const ctas = container.querySelectorAll('.hero-cta');

  gsap
    .timeline({ defaults: { ease: 'power3.out' } })
    .from(badge, { y: -16, opacity: 0, duration: 0.5 })
    .from(heading, { y: 30, opacity: 0, duration: 0.6 }, '-=0.25')
    .from(subheading, { y: 20, opacity: 0, duration: 0.5 }, '-=0.3')
    .from(ctas, { y: 20, opacity: 0, duration: 0.5, stagger: 0.1 }, '-=0.3');
}

export function revealOnScroll(elements: Element[]): void {
  if (prefersReducedMotion()) return;

  elements.forEach((el, index) => {
    gsap.from(el, {
      y: 40,
      opacity: 0,
      duration: 0.6,
      delay: (index % 3) * 0.1,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });
}

export function playNavEntrance(container: HTMLElement): void {
  if (prefersReducedMotion()) return;

  gsap.from(container, { y: -20, opacity: 0, duration: 0.5, ease: 'power3.out' });
}

/**
 * Drifts the stacked fee-card mockups at different rates as the hero scrolls
 * past. Uses x/y (not yPercent) so GSAP decomposes the existing CSS
 * rotate+translate transform and layers the scroll offset on top of it,
 * instead of overwriting the rotation.
 */
export function playHeroVisualParallax(container: HTMLElement): void {
  if (prefersReducedMotion()) return;

  const visual = container.querySelector<HTMLElement>('.hero-visual');
  const back = container.querySelector<HTMLElement>('.fee-card--back');
  const front = container.querySelector<HTMLElement>('.fee-card--front');
  if (!visual || !back || !front) return;

  const scrollTrigger = { trigger: visual, start: 'top top', end: 'bottom top', scrub: true };
  gsap.to(back, { y: -36, ease: 'none', scrollTrigger });
  gsap.to(front, { y: 28, ease: 'none', scrollTrigger });
}

/**
 * Counts each element's text up from 0 to its `data-count-to` value once it
 * scrolls into view. `data-suffix` (e.g. "%") is appended after each update.
 */
export function animateCounters(elements: HTMLElement[]): void {
  if (elements.length === 0) return;

  if (prefersReducedMotion()) {
    elements.forEach((el) => {
      const target = Number(el.dataset['countTo'] ?? '0');
      el.textContent = `${target}${el.dataset['suffix'] ?? ''}`;
    });
    return;
  }

  elements.forEach((el) => {
    const target = Number(el.dataset['countTo'] ?? '0');
    const suffix = el.dataset['suffix'] ?? '';
    const counter = { value: 0 };

    gsap.to(counter, {
      value: target,
      duration: 1.4,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      onUpdate: () => {
        el.textContent = `${Math.round(counter.value)}${suffix}`;
      },
    });
  });
}
