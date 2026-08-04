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
