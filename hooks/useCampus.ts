import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { UrlConstants } from '@/constants/apiUrls';
import { useCampusStore } from '@/state/campusStore';
import { University } from '@/types/auth';

interface UniversityGroup {
  country: string;
  state: string;
  universities: University[];
}

export const useCampus = () => {
  const { selectedUniversity, setSelectedUniversity, reset } = useCampusStore();


  const { data: universities = [], isLoading } = useQuery({
    queryKey: ['universities'],
    queryFn: async () => {
      const response = await axios.get<{
        status: string;
        data: UniversityGroup[];
      }>(`${UrlConstants.baseUrl}${UrlConstants.fetchAllUniversities}`);

      return response.data.data.flatMap(
        (group) => group.universities
      );
    },
    staleTime: 5 * 60 * 1000, 
    retry: 2,
  });

  return {
    selectedUniversity,
    universities,
    isLoading,
    setSelectedUniversity,
    reset,
  };
};