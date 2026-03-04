import client from '@/api/client';

export interface AuditLogsParams {
  page?: number;
  size?: number;
  action?: string;
  resource_type?: string;
  start?: string;
  end?: string;
}

export const getAuditLogs = (params?: AuditLogsParams) =>
  client.get('/audit-logs', { params });
