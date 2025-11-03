import { useEffect } from 'react';
import axios from 'axios';
import { UrlConstants } from '@/constants/apiUrls';
import { useCategoriesStore } from '@/state/categoriesStore';

export const useCategories = () => {
  const { categories, isLoading, setCategories, setLoading } = useCategoriesStore();

  const fetchCategories = async (universityId?: string) => {
    try {
      setLoading(true);
      
      const response = await axios.get(
        `${UrlConstants.baseUrl}${UrlConstants.fetchAllCategories(universityId)}`
      );
      
      const transformedCategories = response.data.data.map((item: any) => ({
        id: item.categoryDetails.id,
        name: item.categoryDetails.name,
        subtitle: item.categoryDetails.shortDesc,
        matches: item.matches,
        bgColor: item.categoryDetails.bgColorHex,
        iconColor: item.categoryDetails.colorHex,
        icon: item.categoryDetails.icon,
      }));
      
      setCategories(transformedCategories);
    } catch (error: any) {
      console.error("Failed to load categories:", error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    categories,
    isLoading,
    fetchCategories,
  };
};