import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Batch } from '../../../../../core/models/batch.model';
import { StudentListItem } from '../../../../../core/models/student.model';
import { StatusBadge } from '../../../../../shared/components/status-badge/status-badge';

const STATUS_OPTIONS = ['PAID', 'PENDING', 'PARTIAL', 'OVERDUE'] as const;

@Component({
  selector: 'app-student-list-table',
  imports: [
    DecimalPipe,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    StatusBadge,
  ],
  templateUrl: './student-list-table.html',
  styleUrl: './student-list-table.scss',
})
export class StudentListTable implements OnChanges {
  @Input() students: StudentListItem[] = [];
  @Input() loading = false;
  @Input() searchTerm = '';
  @Input() statusFilter: string | null = null;
  // Only the Students page (which spans every class) shows this — a
  // single-class roster like ClassDetail's has nothing to filter by.
  @Input() showClassFilter = false;
  @Input() batches: Batch[] = [];
  @Input() classFilter: number | null = null;

  @Output() searchTermChange = new EventEmitter<string>();
  @Output() statusFilterChange = new EventEmitter<string | null>();
  @Output() classFilterChange = new EventEmitter<number | null>();
  @Output() addStudent = new EventEmitter<void>();
  @Output() editStudent = new EventEmitter<StudentListItem>();
  @Output() manageFees = new EventEmitter<StudentListItem>();
  @Output() deactivateStudent = new EventEmitter<StudentListItem>();
  @Output() exportCsv = new EventEmitter<void>();

  // Setter-based query, not `ngAfterViewInit`: the <table>/MatSort only
  // exists once loading resolves and there's at least one row (it's behind
  // an @if/@else), so the query result appears well after initial view init
  // — a setter re-fires each time Angular re-resolves it, a plain
  // ngAfterViewInit read would only ever see `undefined`.
  @ViewChild(MatSort) set matSort(sort: MatSort | undefined) {
    if (sort) this.dataSource.sort = sort;
  }

  readonly statusOptions = STATUS_OPTIONS;
  readonly displayedColumns = [
    'roll_no',
    'full_name',
    'batch',
    'monthly_fee_amount',
    'current_status',
    'actions',
  ];

  readonly currentMonthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  readonly dataSource = new MatTableDataSource<StudentListItem>([]);

  constructor() {
    this.dataSource.sortingDataAccessor = (student, columnId) => {
      switch (columnId) {
        case 'batch':
          return student.batch.name;
        case 'current_status':
          return student.current_status ?? '';
        case 'monthly_fee_amount':
          return Number(student.monthly_fee_amount);
        default:
          return (student as unknown as Record<string, string>)[columnId];
      }
    };
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['students']) {
      this.dataSource.data = this.students;
    }
  }
}
