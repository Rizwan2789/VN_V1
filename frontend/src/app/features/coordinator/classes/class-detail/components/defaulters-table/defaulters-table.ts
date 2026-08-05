import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';

import { ClassDefaulter } from '../../../../../../core/models/dashboard.model';

@Component({
  selector: 'app-defaulters-table',
  imports: [RouterLink, MatButtonModule, MatTableModule],
  templateUrl: './defaulters-table.html',
  styleUrl: './defaulters-table.scss',
})
export class DefaultersTable {
  @Input() defaulters: ClassDefaulter[] = [];

  readonly displayedColumns = ['full_name', 'phone', 'pending_amount', 'actions'];
}
