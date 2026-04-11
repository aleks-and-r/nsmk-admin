import { useQuery } from '@tanstack/react-query';
import { getVenues, getVenueById } from '@/services/venues.service';

export const useVenues = () => {
  return useQuery({
    queryKey: ['venues/'],
    queryFn: getVenues,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
};

export const useVenue = (id: string) => {
  return useQuery({
    queryKey: ['venues/', id],
    queryFn: () => getVenueById(id),
    staleTime: 1000 * 60 * 5,
    retry: 1,
    enabled: !!id,
  });
};
