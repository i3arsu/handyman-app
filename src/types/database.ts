// Mirror types for each Supabase table row.
// Keep in sync with supabase/schema.sql.

export type UserRole = 'client' | 'handyman';
export type JobStatus = 'open' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  notif_push: boolean;
  notif_email_marketing: boolean;
  notif_sms: boolean;
  created_at: string;
}

export interface Job {
  id: string;
  client_id: string;
  handyman_id: string | null;
  title: string;
  description: string | null;
  category: string;
  address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  payout: number;
  show_up_fee: number;
  is_urgent: boolean;
  status: JobStatus;
  created_at: string;
  // Joined fields (not in DB, populated by queries)
  client?: Profile;
  job_applications?: Array<{
    status: string;
    handyman: { id: string; full_name: string | null } | null;
  }>;
}

export interface JobApplication {
  id: string;
  job_id: string;
  handyman_id: string;
  status: ApplicationStatus;
  created_at: string;
  // Joined fields
  job?: Job;
  handyman?: Profile;
}

export type NotificationType =
  | 'application_received'
  | 'application_accepted'
  | 'application_rejected'
  | 'job_started'
  | 'job_completed'
  | 'new_message'
  | 'new_nearby_job';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  job_id: string | null;
  read: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  job_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  // Joined fields
  sender?: Profile;
}
