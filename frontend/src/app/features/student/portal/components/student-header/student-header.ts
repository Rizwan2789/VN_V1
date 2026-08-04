import { Component, Input } from '@angular/core';

import { Student } from '../../../../../core/models/student.model';

@Component({
  selector: 'app-student-header',
  imports: [],
  templateUrl: './student-header.html',
  styleUrl: './student-header.scss',
})
export class StudentHeader {
  @Input() student: Student | null = null;
}
