import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { UrlConstants } from '@/constants/apiUrls';
import { useAuthStore } from '@/state/authStore';
import { Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { toast } from 'sonner-native';

interface LeaveGroupData {
  groupID: string;
}

interface ReportGroupData {
  groupID: string;
  reportReason: string;
  reportExplanation?: string;
}

interface MarkCompleteData {
  groupID: string;
}

export const useGroupActions = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const leaveGroupMutation = useMutation({
    mutationFn: async (data: LeaveGroupData) => {
      const response = await axios.post(
        `${UrlConstants.baseUrl}${UrlConstants.leaveGroup}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success("You have left the group");
    },
    onError: () => {
      toast.error("Failed to leave group");
    },
  });

  const reportGroupMutation = useMutation({
    mutationFn: async (data: ReportGroupData) => {
      const response = await axios.post(
        `${UrlConstants.baseUrl}${UrlConstants.reportGroup}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Report submitted successfully");
    },
    onError: () => {
      toast.error("Failed to submit report");
    },
  });

  const markCompleteMutation = useMutation({
    mutationFn: async (data: MarkCompleteData) => {
      const response = await axios.post(
        `${UrlConstants.baseUrl}${UrlConstants.markGroupAsCompleted}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success("Group marked as completed");
    },
    onError: () => {
      toast.error("Failed to mark as completed");
    },
  });

  const leaveGroup = async (groupID: string) => {
    await leaveGroupMutation.mutateAsync({ groupID });
  };

  const reportGroup = async (groupID: string, reportReason: string, reportExplanation?: string) => {
    await reportGroupMutation.mutateAsync({ groupID, reportReason, reportExplanation });
  };

  const markAsCompleted = async (groupID: string) => {
    await markCompleteMutation.mutateAsync({ groupID });
  };

  const shareGroup = async (groupDetails: any) => {
    if (!groupDetails?.shareLink) {
      toast.error("No share link available");
      return;
    }

    try {
      await Share.share({
        message: `Join our group "${groupDetails.name}" on TarpAI Connect!\n\n${groupDetails.shareLink}`,
        url: groupDetails.shareLink,
        title: `Join ${groupDetails.name} on TarpAI Connect`,
      });
    } catch (error) {
      try {
        await Clipboard.setStringAsync(groupDetails.shareLink);
        toast.success("Group link copied to clipboard!");
      } catch {
        toast.error("Could not share or copy link");
      }
    }
  };

  return {
    leaveGroup,
    reportGroup,
    markAsCompleted,
    shareGroup,
    isLeaving: leaveGroupMutation.isPending,
    isReporting: reportGroupMutation.isPending,
    isMarkingComplete: markCompleteMutation.isPending,
  };
};