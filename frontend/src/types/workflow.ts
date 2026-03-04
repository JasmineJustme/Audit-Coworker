import type { ParamDefinition } from './api';

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  capability_tags: string[];
  dify_endpoint: string;
  dify_api_key: string;
  input_params: ParamDefinition[];
  output_params: ParamDefinition[];
  timeout_seconds: number;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}
