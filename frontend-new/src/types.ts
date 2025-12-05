export type Mailbox = {
  email: string;
  created_at: string;
  expires_at: string;
  time_remaining_seconds?: number;
  duration_minutes?: number;
};

export type EmailSummary = {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  received_at: string;
  is_read: boolean;
};

export type EmailDetailData = {
  id: string;
  sender: string;
  subject: string;
  body: string;
  body_html?: string;
  received_at: string;
  is_read: boolean;
};
