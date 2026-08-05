export interface BatchBreakdown {
  batch_id: number;
  batch_name: string;
  student_count: number;
}

export interface DashboardMetrics {
  total_collected_this_month: string;
  pending_count: number;
  overdue_count: number;
  active_students_count: number;
  batch_breakdown: BatchBreakdown[];
}

export interface ClassDefaulter {
  student_id: number;
  full_name: string;
  phone: string | null;
  pending_amount: string;
}

export interface ClassBreakdown {
  batch_id: number;
  batch_name: string;
  total_students: number;
  paid_count: number;
  pending_count: number;
  overdue_count: number;
  no_record_count: number;
  pending_amount: string;
  collected_amount: string;
  defaulters: ClassDefaulter[];
}
