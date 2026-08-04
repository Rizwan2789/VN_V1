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
  const illustration = container.querySelector('.hero-illustration');

  gsap
    .timeline({ defaults: { ease: 'power3.out' } })
    .from(badge, { y: -16, opacity: 0, duration: 0.5 })
    .from(heading, { y: 30, opacity: 0, duration: 0.6 }, '-=0.25')
    .from(subheading, { y: 20, opacity: 0, duration: 0.5 }, '-=0.3')
    .from(ctas, { y: 20, opacity: 0, duration: 0.5, stagger: 0.1 }, '-=0.3')
    .from(illustration, { scale: 0.92, opacity: 0, duration: 0.7 }, '-=0.5');
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
