import { UrlConstants } from '@/constants/apiUrls';
import { useAuthStore } from '@/state/authStore';
import { useCampusStore } from '@/state/campusStore';
import { University } from '@/types/auth';
import { storage, StorageKeys } from '@/utils/storage';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
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
    const hydrateCampusSelection = async () => {
      if (universities.length > 0 && !selectedUniversity && isHydrated) {
        const storedId = await storage.getValue(StorageKeys.UNIVERSITY_ID);

        if (storedId) {
          const university = universities.find(u => u.id === storedId);
          if (university) {
            setSelectedUniversity(university);
            return;
          }
        }

        if (user?.universityID) {
          const userUniversity = universities.find(u => u.id === user.universityID);
          if (userUniversity) {
            setSelectedUniversity(userUniversity);
            return;
          }
        }

        if (!user) {
          const defaultUniversity = universities.find(
            (u) => u.name === "Louisiana Tech University"
          );
          if (defaultUniversity) {
            setSelectedUniversity(defaultUniversity);
          }
        }
      }
    };

    hydrateCampusSelection();
  }, [universities, selectedUniversity, isHydrated, user?.universityID]);

  return {
    selectedUniversity,
    universities,
    isLoading,
    setSelectedUniversity,
    reset,
  };
};