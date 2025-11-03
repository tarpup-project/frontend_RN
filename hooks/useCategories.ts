// import { useCallback } from 'react';
// import axios from 'axios';
// import { UrlConstants } from '@/constants/apiUrls';
// import { useCategoriesStore } from '@/state/categoriesStore';

// export const useCategories = () => {
//   const { categories, isLoading, setCategories, setLoading } = useCategoriesStore();

//   const fetchCategories = useCallback(async (universityId?: string) => {
//     try {
//       setLoading(true);
      
//       const response = await axios.get(
//         `${UrlConstants.baseUrl}${UrlConstants.fetchAllCategories(universityId)}`
//       );
      
//       const transformedCategories = response.data.data.map((item: any) => ({
//         id: item.categoryDetails.id,
//         name: item.categoryDetails.name,
//         subtitle: item.categoryDetails.shortDesc,
//         matches: item.matches,
//         bgColor: item.categoryDetails.bgColorHex,
//         iconColor: item.categoryDetails.colorHex,
//         icon: item.categoryDetails.icon,
//       }));
      
//       setCategories(transformedCategories);
//     } catch (error: any) {
//       console.error("Failed to load categories:", error);
//       setCategories([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [setCategories, setLoading]);

//   return {
//     categories,
//     isLoading,
//     fetchCategories,
//   };
// };


import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { UrlConstants } from '@/constants/apiUrls';
import {
  BookOpen,
  Car,
  Gamepad2,
  Gift,
  Heart,
  Home,
  PartyPopper,
  ShoppingBag,
} from "lucide-react-native";


const getIconComponent = (iconName: string) => {
  const iconMap: { [key: string]: any } = {
    'Car': Car,
    'Home': Home,
    'ShoppingBag': ShoppingBag,
    'Gamepad2': Gamepad2,
    'Heart': Heart,
    'BookOpen': BookOpen,
    'Gift': Gift,
    'PartyPopper': PartyPopper,
  };
  return iconMap[iconName] || Car; 
};

export const useCategories = (universityId?: string) => {
  return useQuery({
    queryKey: ['categories', universityId],
    queryFn: async () => {
      const response = await axios.get(
        `${UrlConstants.baseUrl}${UrlConstants.fetchAllCategories(universityId)}`
      );
      
      return response.data.data.map((item: any) => ({
        id: item.categoryDetails.id,
        name: item.categoryDetails.name,
        subtitle: item.categoryDetails.shortDesc,
        matches: item.matches,
        bgColor: item.categoryDetails.bgColorHex,
        iconColor: item.categoryDetails.colorHex,
        icon: getIconComponent(item.categoryDetails.icon), 
      }));
    },
    enabled: true, 
    staleTime: 30 * 1000, 
    retry: 2,
  });
};