import { useQuery } from '@tanstack/react-query';
import { getCoachById } from '@/services/coaches.service';

export const useCoachById = (id: string) => {
  return useQuery({
    queryKey: ['coaches', id],
    queryFn: () => getCoachById(id),
    staleTime: 1000 * 60 * 5,
    enabled: !!id,
  });
};
