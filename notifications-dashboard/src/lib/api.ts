import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface PaginationMeta {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface Order {
  id: number;
  userId: string;
  orderNumber: string;
  status: string;
  total: number;
  metadata?: Record<string, any>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: number;
  recipientId: string;
  channelId: string;
  channel: Channel;
  templateName: string;
  data: Record<string, any>;
  status: string;
  idempotencyKey: string;
  retryCount: number;
  sentAt?: string;
  failedAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Channel {
  id: string;
  type: string;
  name: string;
  configuration: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AvailableChannel {
  type: string;
  name: string;
  description: string;
  requiredConfig?: string[];
  defaultConfig?: Record<string, any>;
  icon?: string;
  needsConfiguration?: boolean;
  available?: boolean; // New field to indicate if channel is ready to use
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export const ordersApi = {
  getAll: (params?: QueryParams) =>
    api.get<PaginatedResponse<Order>>('/orders', { params }),

  getOne: (id: number) =>
    api.get<Order>(`/orders/${id}`),

  create: (data: Partial<Order>) =>
    api.post<Order>('/orders', data),

  update: (id: number, data: Partial<Order>) =>
    api.patch<Order>(`/orders/${id}`, data),

  delete: (id: number) =>
    api.delete(`/orders/${id}`),
};

export const notificationsApi = {
  getAll: (params?: QueryParams) =>
    api.get<PaginatedResponse<Notification>>('/notifications', { params }),

  getOne: (id: number) =>
    api.get<Notification>(`/notifications/${id}`),

  create: (data: {
    recipientId: string;
    channelId: string;
    templateName: string;
    data: Record<string, any>;
    idempotencyKey?: string;
  }) =>
    api.post<Notification>('/notifications', data),
};

export const channelsApi = {
  getAll: () =>
    api.get<Channel[]>('/channels'),

  getAvailable: () =>
    api.get<AvailableChannel[]>('/channels/available'),

  create: (data: { type: string; name: string; configuration: Record<string, any> }) =>
    api.post<Channel>('/channels', data),

  toggleActive: (id: string, isActive: boolean) =>
    api.patch<Channel>(`/channels/${id}`, { isActive }),
};
