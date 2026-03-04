import client from '@/api/client';

// History
export const exportHistory = (params?: { start_time?: string; end_time?: string }) =>
  client.get('/history/export', { params, responseType: 'blob' });

export const getHistory = (params?: {
  page?: number;
  size?: number;
  status?: string;
  agent_id?: string;
  start_time?: string;
  end_time?: string;
  keyword?: string;
}) => client.get('/history', { params });

export const getHistoryDetail = (historyId: string) =>
  client.get(`/history/${historyId}`);

// Analytics
export const getAgentStats = (params?: { start_time?: string; end_time?: string }) =>
  client.get('/analytics/agent-stats', { params });

export const getTaskStats = (params?: { start_time?: string; end_time?: string }) =>
  client.get('/analytics/task-stats', { params });

export const getLLMUsage = (params?: { start_time?: string; end_time?: string }) =>
  client.get('/analytics/llm-usage', { params });
