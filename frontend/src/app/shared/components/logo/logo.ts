import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-logo',
  imports: [],
  templateUrl: './logo.html',
  styleUrl: './logo.scss',
})
export class Logo {
  @Input() size = 40;
  @Input() ring = false;
}
