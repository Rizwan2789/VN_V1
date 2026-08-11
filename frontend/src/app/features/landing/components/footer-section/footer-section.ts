import { Component } from '@angular/core';

import { Logo } from '../../../../shared/components/logo/logo';

@Component({
  selector: 'app-footer-section',
  imports: [Logo],
  templateUrl: './footer-section.html',
  styleUrl: './footer-section.scss',
})
export class FooterSection {
  readonly year = new Date().getFullYear();
}
