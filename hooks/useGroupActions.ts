import { useState } from 'react';
import { Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { toast } from 'sonner-native';
import { api } from '@/api/client';
import { UrlConstants } from '@/constants/apiUrls';
import { subscribeToTopic, unsubscribeFromTopic } from '@/hooks/usePushNotifications';

interface ReportGroupData {
  groupID: string;
  reportReason: string;
  reportExplanation?: string;
}

export const useGroupActions = () => {
  const [isLeaving, setIsLeaving] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);

  const joinGroup = async (groupID: string): Promise<boolean> => {
    setIsJoining(true);
    try {
      await api.post(UrlConstants.fetchInviteGroupDetails(groupID), {});
      
      // Subscribe to group notifications
      await subscribeToTopic(`group_${groupID}`);
      
      toast.success("You have joined the group");
      return true;
    } catch (error) {
      console.error('Join group error:', error);
      toast.error("Failed to join group");
      return false;
    } finally {
      setIsJoining(false);
    }
  };

  const leaveGroup = async (groupID: string): Promise<boolean> => {
    setIsLeaving(true);
    try {
      await api.post(UrlConstants.leaveGroup, { groupID });
      
      // Unsubscribe from group notifications
      await unsubscribeFromTopic(`group_${groupID}`);
      
      toast.success("You have left the group");
      return true;
    } catch (error) {
      console.error('Leave group error:', error);
      toast.error("Failed to leave group");
      return false;
    } finally {
      setIsLeaving(false);
    }
  };

  const reportGroup = async (data: ReportGroupData): Promise<boolean> => {
    setIsReporting(true);
    try {
      await api.post(UrlConstants.reportGroup, data);
      toast.success("Report submitted successfully");
      return true;
    } catch (error) {
      console.error('Report group error:', error);
      toast.error("Failed to submit report");
      return false;
    } finally {
      setIsReporting(false);
    }
  };

  const markAsCompleted = async (groupID: string): Promise<boolean> => {
    setIsMarkingComplete(true);
    try {
      await api.post(UrlConstants.markGroupAsCompleted, { groupID });
      toast.success("Group marked as completed");
      return true;
    } catch (error) {
      console.error('Mark complete error:', error);
      toast.error("Failed to mark as completed");
      return false;
    } finally {
      setIsMarkingComplete(false);
    }
  };

  const shareGroup = async (groupDetails: any): Promise<void> => {
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
    joinGroup,
    leaveGroup,
    reportGroup,
    markAsCompleted,
    shareGroup,
    isJoining,
    isLeaving,
    isReporting,
    isMarkingComplete,
  };
};