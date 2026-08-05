import { Component, EventEmitter, HostBinding, HostListener, Input, Output } from '@angular/core';

/**
 * Generic card wrapper — no such shared primitive existed before this;
 * every feature (metric-card, fee-cell, ledger-card) hand-rolled its own
 * card markup/CSS. Backs the new class-cards grid and can replace those
 * one-off implementations over time.
 */
@Component({
  selector: 'app-card',
  imports: [],
  templateUrl: './card.html',
  styleUrl: './card.scss',
})
export class Card {
  @Input() clickable = false;
  @Input() padding = '1.25rem';
  @Output() cardClick = new EventEmitter<void>();

  @HostBinding('class.is-clickable') get isClickable(): boolean {
    return this.clickable;
  }

  @HostBinding('style.padding') get hostPadding(): string {
    return this.padding;
  }

  @HostBinding('attr.role') get role(): string | null {
    return this.clickable ? 'button' : null;
  }

  @HostBinding('attr.tabindex') get tabIndex(): number | null {
    return this.clickable ? 0 : null;
  }

  @HostListener('click')
  onClick(): void {
    if (this.clickable) this.cardClick.emit();
  }

  @HostListener('keydown.enter', ['$event'])
  @HostListener('keydown.space', ['$event'])
  onKeydown(event: Event): void {
    if (!this.clickable) return;
    event.preventDefault();
    this.cardClick.emit();
  }
}
