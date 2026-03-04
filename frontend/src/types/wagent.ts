import type { ParamDefinition } from './api';

export interface WAgentStepMapping {
  source: string;
  upstream_step?: number;
  upstream_param?: string;
  fixed_value?: string;
}

export interface WAgentStep {
  order: number;
  workflow_id: string;
  workflow_name: string;
  execution_mode: string;
  param_mapping: Record<string, WAgentStepMapping>;
}

export interface WAgent {
  id: string;
  name: string;
  description?: string;
  capability_tags: string[];
  current_version: number;
  input_params: ParamDefinition[];
  output_params: ParamDefinition[];
  timeout_seconds: number;
  auto_execute: boolean;
  confirm_before_exec: boolean;
  is_enabled: boolean;
  source: string;
  call_count: number;
  success_count: number;
  created_at: string;
  updated_at: string;
}

export interface WAgentVersion {
  id: string;
  wagent_id: string;
  version: number;
  steps: WAgentStep[];
  input_params: ParamDefinition[];
  output_params: ParamDefinition[];
  change_note?: string;
  created_at: string;
}
