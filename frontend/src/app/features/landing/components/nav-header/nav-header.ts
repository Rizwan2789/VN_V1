import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { Logo } from '../../../../shared/components/logo/logo';

@Component({
  selector: 'app-nav-header',
  imports: [RouterLink, MatButtonModule, MatIconModule, Logo],
  templateUrl: './nav-header.html',
  styleUrl: './nav-header.scss',
})
export class NavHeader {}
