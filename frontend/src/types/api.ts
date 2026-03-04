export interface APIResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ParamDefinition {
  name: string;
  type: string;
  required?: boolean;
  default?: string | null;
  description?: string | null;
}
