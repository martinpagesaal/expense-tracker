import { useQuery } from '@tanstack/react-query';

import { fetchProfiles } from '@/lib/supabase-queries';

export const useProfiles = () => {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: fetchProfiles,
  });
};
