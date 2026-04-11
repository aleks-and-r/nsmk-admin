import apiClient from '@/lib/axios';
import type { PaginatedResponse } from '@/types/api';

export interface Venue {
  id: number;
  name: string;
  address: string;
  city: string;
  court_count: number;
  is_active: boolean;
}

export interface VenuePayload {
  name: string;
  address?: string;
  city?: string;
  court_count?: number;
  is_active?: boolean;
}

export const getVenues = async (): Promise<PaginatedResponse<Venue>> => {
  const { data } = await apiClient.get<PaginatedResponse<Venue>>('venues/');
  return data;
};

export const getVenueById = async (id: string): Promise<Venue> => {
  const { data } = await apiClient.get<Venue>(`venues/${id}/`);
  return data;
};

export const createVenue = async (payload: VenuePayload): Promise<Venue> => {
  const { data } = await apiClient.post<Venue>('venues/', payload);
  return data;
};

export const updateVenue = async (
  id: string,
  payload: VenuePayload,
): Promise<Venue> => {
  const { data } = await apiClient.put<Venue>(`venues/${id}/`, payload);
  return data;
};

export const deleteVenue = async (id: string): Promise<void> => {
  await apiClient.delete(`venues/${id}/`);
};

export const importVenues = async (file: File): Promise<unknown> => {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await apiClient.post('venues/import/', fd);
  return data;
};
