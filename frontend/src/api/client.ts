import axios from 'axios';
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';

export interface APIResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

const client: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => config,
  (error) => Promise.reject(error),
);

client.interceptors.response.use(
  (response: AxiosResponse<APIResponse | Blob>) => {
    if (response.config.responseType === 'blob') {
      return response;
    }
    const { data } = response;
    if (data && typeof data === 'object' && 'code' in data && (data as APIResponse).code !== 200) {
      message.error((data as APIResponse).message || '请求失败');
      return Promise.reject(new Error((data as APIResponse).message));
    }
    return response;
  },
  (error) => {
    if (error.response) {
      const status = error.response.status;
      if (status === 404) {
        message.error('请求的资源不存在');
      } else if (status === 500) {
        message.error('服务器内部错误');
      } else {
        message.error(error.response.data?.message || '请求失败');
      }
    } else if (error.code === 'ECONNABORTED') {
      message.error('请求超时，请重试');
    } else {
      message.error('网络连接失败，请检查');
    }
    return Promise.reject(error);
  },
);

export default client;
