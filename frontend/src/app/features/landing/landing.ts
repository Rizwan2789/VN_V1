import { Component } from '@angular/core';

import { FeaturesSection } from './components/features-section/features-section';
import { FooterSection } from './components/footer-section/footer-section';
import { HeroSection } from './components/hero-section/hero-section';

@Component({
  selector: 'app-landing',
  imports: [HeroSection, FeaturesSection, FooterSection],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing {}
