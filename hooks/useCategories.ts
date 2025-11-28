import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { UrlConstants } from '@/constants/apiUrls';

const getIconComponent = (iconName: string) => {
  const iconMap: { [key: string]: string } = {
    'Car': 'car-outline',
    'Home': 'home-outline',
    'ShoppingBag': 'bag-outline',
    'Gamepad2': 'game-controller-outline',
    'Heart': 'heart-outline',
    'BookOpen': 'book-outline',
    'Gift': 'gift-outline',
    'PartyPopper': 'balloon-outline',
  };
  return iconMap[iconName] || 'car-outline'; 
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