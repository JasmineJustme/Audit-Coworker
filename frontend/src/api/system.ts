import client from '@/api/client';

export const initComplete = () => client.post('/system/init-complete');
