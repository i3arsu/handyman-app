export type JobStatus = 'scheduled' | 'in_progress' | 'awaiting_pro' | 'completed';

export interface AssignedPro {
  name: string;
  initials: string;
  avatarColor: string;
}

export interface ClientJob {
  id: string;
  title: string;
  category: string;
  categoryIcon: string;
  categoryIconBg: string;
  date: string;
  status: JobStatus;
  pro: AssignedPro | null;
}

export interface Job {
  id: string;
  title: string;
  category: string;
  distance: string;
  estimatedTime: string;
  payout: number;
  isUrgent: boolean;
  scheduledWindow: string;
  clientRating: number;
  coordinate: {
    latitude: number;
    longitude: number;
  };
}
