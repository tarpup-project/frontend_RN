import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { UrlConstants } from '@/constants/apiUrls';

interface RecentMatchMember {
  id: string;
  fname: string;
  bgUrl?: string;
}

interface RecentMatch {
  id: string;
  categoryDetails: {
    id: string;
    name: string;
    icon: string;
    bgColorHex: string;
    colorHex: string;
  };
  matches: Array<{
    id: string;
    createdAt: string;
    members: RecentMatchMember[];
  }>;
  members: RecentMatchMember[];
  avgMatch: number;
  createdAt: string;
}

interface RecentMatchesResponse {
  allMatches: RecentMatch[];
  matchSummary: {
    avgPercent: number;
    relativePercent: number;
  };
}

export const useRecentMatches = (universityId?: string, stateId?: string) => {
  return useQuery({
    queryKey: ['recentMatches', universityId, stateId],
    queryFn: async () => {
      const response = await axios.get<{
        status: string;
        data: RecentMatchesResponse;
      }>(`${UrlConstants.baseUrl}${UrlConstants.fetchAllMatches(universityId, stateId)}`);
      
      return response.data.data;
    },
    enabled: true,
    staleTime: 30 * 1000, 
    retry: 2,
  });
};