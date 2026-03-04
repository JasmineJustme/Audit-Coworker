import client from '@/api/client';

export const search = (q: string) =>
  client.get('/search', { params: { q } });
