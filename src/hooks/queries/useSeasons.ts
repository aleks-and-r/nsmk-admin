import { useQuery } from '@tanstack/react-query';
import { getSeasons, getSeasonById } from '@/services/seasons.service';

export const useSeasons = () => {
  return useQuery({
    queryKey: ['seasons'],
    queryFn: getSeasons,
  });
};

export const useSeason = (id: string) => {
  return useQuery({
    queryKey: ['seasons', id],
    queryFn: () => getSeasonById(id),
    enabled: !!id,
  });
};
