import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { UrlConstants } from '@/constants/apiUrls';
import { useCampusStore } from '@/state/campusStore';
import { useAuthStore } from '@/state/authStore';
import { University } from '@/types/auth';
import { useEffect } from 'react';

interface UniversityGroup {
  country: string;
  state: string;
  universities: University[];
}

export const useCampus = () => {
  const { selectedUniversity, setSelectedUniversity, reset } = useCampusStore();
  const { user, isHydrated } = useAuthStore();

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

  useEffect(() => {
    if (
      isHydrated &&
      user?.universityID && 
      universities.length > 0 && 
      !selectedUniversity
    ) {
      const userUniversity = universities.find(
        uni => uni.id === user.universityID
      );

      if (userUniversity) {
        setSelectedUniversity(userUniversity);
      } 
    }
  }, [user?.universityID, universities, selectedUniversity, isHydrated, setSelectedUniversity]);

  return {
    selectedUniversity,
    universities,
    isLoading,
    setSelectedUniversity,
    reset,
  };
};