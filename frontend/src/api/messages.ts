import client from '@/api/client';

export const getMessages = (params?: {
  page?: number;
  size?: number;
  status?: string;
  type?: string;
  start_date?: string;
  end_date?: string;
}) => client.get('/messages', { params });

export const getUnreadCount = () => client.get('/messages/unread-count');

export const markMessageRead = (messageId: string) =>
  client.patch(`/messages/${messageId}/read`);

export const markMessageProcessed = (messageId: string) =>
  client.patch(`/messages/${messageId}/processed`);

export const batchReadMessages = (messageIds: string[]) =>
  client.post('/messages/batch-read', { message_ids: messageIds });

export const batchDeleteMessages = (messageIds: string[]) =>
  client.delete('/messages/batch-delete', {
    data: { message_ids: messageIds },
  });
