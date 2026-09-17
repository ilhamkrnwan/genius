export interface XpCelebrationItem {
  id: string;
  type: 'ATTENDANCE_IN' | 'ATTENDANCE_OUT' | 'FGD' | 'DAY_3' | 'ORMAWA' | 'OTHER';
  title: string;
  giverName: string;
  giverRole?: string;
  xp: number;
  totalXp?: number;
  message?: string;
  icon?: string;
  timestamp?: string;
}
