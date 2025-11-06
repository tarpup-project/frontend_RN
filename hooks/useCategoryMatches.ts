import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { UrlConstants } from '@/constants/apiUrls';

interface CategoryMatch {
  id: string;
  createdAt: string;
  members: Array<{
    user: {
      id: string;
      fname: string;
      bgUrl?: string;
    };
  }>;
  request?: {
    title: string;
  };
  group?: {
    name: string;
  };
}

export const useCategoryMatches = (categoryId: string, campusId?: string) => {
  return useQuery({
    queryKey: ['categoryMatches', categoryId, campusId],
    queryFn: async () => {
      const response = await axios.get<{
        status: string;
        data: CategoryMatch[];
      }>(`${UrlConstants.baseUrl}${UrlConstants.fetchCategoryMatches(categoryId, campusId || '')}`);
      
      return response.data.data;
    },
    enabled: !!categoryId && !!campusId,
    staleTime: 30 * 1000,
    retry: 2,
  });
};