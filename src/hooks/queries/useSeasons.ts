import { useQuery } from '@tanstack/react-query';
import { getSeasons, getSeasonById } from '@/services/seasons.service';

export const useSeasons = () => {
  return useQuery({
    queryKey: ['seasons'],
    queryFn: getSeasons,
    staleTime: 1000 * 60 * 5,
  });
};

export const useSeason = (id: string) => {
  return useQuery({
    queryKey: ['seasons', id],
    queryFn: () => getSeasonById(id),
    staleTime: 1000 * 60 * 5,
    enabled: !!id,
  });
};
