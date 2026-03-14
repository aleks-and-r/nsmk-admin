import { useQuery } from '@tanstack/react-query';
import { getClubs, getClubById } from '@/services/clubs.service';

export const useClubs = () => {
  return useQuery({
    queryKey: ['clubs'],
    queryFn: getClubs,
    staleTime: 1000 * 60 * 5,
  });
};

export const useClub = (id: string) => {
  return useQuery({
    queryKey: ['clubs', id],
    queryFn: () => getClubById(id),
    staleTime: 1000 * 60 * 5,
    enabled: !!id,
  });
};
