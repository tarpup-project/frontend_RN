// import { useCallback } from 'react';
// import axios from 'axios';
// import { UrlConstants } from '@/constants/apiUrls';
// import { useCampusStore } from '@/state/campusStore';
// import { University } from '@/types/auth';

// interface UniversityGroup {
//   country: string;
//   state: string;
//   universities: University[];
// }

// export const useCampus = () => {
//   const { 
//     selectedUniversity, 
//     universities, 
//     isLoadingUniversities, 
//     setSelectedUniversity, 
//     setUniversities, 
//     setIsLoadingUniversities, 
//     reset 
//   } = useCampusStore();

//   const fetchUniversities = useCallback(async () => {
//     try {
//       setIsLoadingUniversities(true);

//       const response = await axios.get<{
//         status: string;
//         data: UniversityGroup[];
//       }>(`${UrlConstants.baseUrl}${UrlConstants.fetchAllUniversities}`);

//       const allUniversities: University[] = response.data.data.flatMap(
//         (group) => group.universities
//       );

//       setUniversities(allUniversities);
//     } catch (error: any) {
//       console.error("Failed to load universities:", error);
//       setUniversities([]);
//     } finally {
//       setIsLoadingUniversities(false);
//     }
//   }, [setIsLoadingUniversities, setUniversities]);

//   return {
//     selectedUniversity,
//     universities,
//     isLoadingUniversities,
//     setSelectedUniversity,
//     reset,
//     fetchUniversities,
//   };
// };



import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useCampusStore } from '@/state/campusStore';
import { UrlConstants } from '@/constants/apiUrls';
import axios from 'axios';

export const useCampus = () => {
  const { selectedUniversity, setSelectedUniversity, reset } = useCampusStore();
  const { setUniversities, setIsLoadingUniversities } = useCampusStore();

  const { data: universities = [], isLoading } = useQuery({
    queryKey: ['universities'],
    queryFn: async () => {
      const response = await axios.get(`${UrlConstants.baseUrl}${UrlConstants.fetchAllUniversities}`);
      return response.data.data.flatMap((group: any) => group.universities);
    },
    staleTime: 5 * 60 * 1000, 
    retry: 3,
  });


  useEffect(() => {
    setUniversities(universities);
    setIsLoadingUniversities(isLoading);
  }, [universities, isLoading]);

  return { selectedUniversity, universities, isLoading, setSelectedUniversity, reset };
};