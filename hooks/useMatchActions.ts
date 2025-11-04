import { useState, useCallback } from 'react';
import { api } from '@/api/client';
import { UrlConstants } from '../constants/apiUrls';

export type MatchAction = 'private' | 'public' | 'decline' | 'add';

interface MatchResponse {
  status: 'ok' | 'error';
  groupId?: string;
  message?: string;
}

interface UseMatchActionsReturn {
  isLoading: boolean;
  handleMatchAction: (matchId: string, action: MatchAction) => Promise<MatchResponse>;
  joinPublicGroup: (groupId: string) => Promise<boolean>;
}

export const useMatchActions = (): UseMatchActionsReturn => {
  const [isLoading, setIsLoading] = useState(false);

  const handleMatchAction = useCallback(async (
    matchId: string, 
    action: MatchAction
  ): Promise<MatchResponse> => {
    setIsLoading(true);
    try {
      const response = await api.post(UrlConstants.fetchMatchDetails(matchId), {
        action: action
      });
      
      return {
        status: 'ok',
        groupId: response.data.data?.group?.id,
        message: response.data.message
      };
    } catch (err: any) {
      return {
        status: 'error',
        message: err.response?.data?.message || 'Failed to process match action'
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const joinPublicGroup = useCallback(async (groupId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      await api.post(UrlConstants.fetchGroupDetails(groupId), {});
      return true;
    } catch (err) {
      console.error('Failed to join group:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    handleMatchAction,
    joinPublicGroup,
  };
};