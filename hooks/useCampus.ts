import { useEffect } from 'react';
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
  const { 
    selectedUniversity, 
    universities, 
    isLoadingUniversities, 
    setSelectedUniversity, 
    setUniversities, 
    setIsLoadingUniversities, 
    reset 
  } = useCampusStore();

  const fetchUniversities = async () => {
    try {
      setIsLoadingUniversities(true);

      const response = await axios.get<{
        status: string;
        data: UniversityGroup[];
      }>(`${UrlConstants.baseUrl}${UrlConstants.fetchAllUniversities}`);

      const allUniversities: University[] = response.data.data.flatMap(
        (group) => group.universities
      );

      setUniversities(allUniversities);
    } catch (error: any) {
      console.error("Failed to load universities:", error);
      setUniversities([]);
    } finally {
      setIsLoadingUniversities(false);
    }
  };

  return {
    selectedUniversity,
    universities,
    isLoadingUniversities,
    setSelectedUniversity,
    reset,
    fetchUniversities,
  };
};