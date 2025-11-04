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