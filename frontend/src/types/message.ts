export interface Message {
  id: string;
  type: string;
  title: string;
  content: string;
  status: string;
  related_type?: string;
  related_id?: string;
  action_url?: string;
  external_pushed: boolean;
  created_at: string;
}
