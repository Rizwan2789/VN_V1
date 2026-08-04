import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

import { StudentListItem } from '../../../../../core/models/student.model';
import { StatusBadge } from '../../../../../shared/components/status-badge/status-badge';

const STATUS_OPTIONS = ['PAID', 'PENDING', 'PARTIAL', 'OVERDUE'] as const;

@Component({
  selector: 'app-student-list-table',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    StatusBadge,
  ],
  templateUrl: './student-list-table.html',
  styleUrl: './student-list-table.scss',
})
export class StudentListTable {
  @Input() students: StudentListItem[] = [];
  @Input() loading = false;
  @Input() searchTerm = '';
  @Input() statusFilter: string | null = null;

  @Output() searchTermChange = new EventEmitter<string>();
  @Output() statusFilterChange = new EventEmitter<string | null>();
  @Output() addStudent = new EventEmitter<void>();
  @Output() editStudent = new EventEmitter<StudentListItem>();
  @Output() manageFees = new EventEmitter<StudentListItem>();
  @Output() deactivateStudent = new EventEmitter<StudentListItem>();

  readonly statusOptions = STATUS_OPTIONS;
  readonly displayedColumns = ['roll_no', 'full_name', 'monthly_fee_amount', 'current_status', 'actions'];
}
