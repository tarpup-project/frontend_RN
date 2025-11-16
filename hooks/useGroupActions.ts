import { useState } from 'react';
import { Share, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { toast } from 'sonner-native';
import { api } from '@/api/client';
import { UrlConstants } from '@/constants/apiUrls';

interface ReportGroupData {
  groupID: string;
  reportReason: string;
  reportExplanation?: string;
}

export const useGroupActions = () => {
  const [isLeaving, setIsLeaving] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);

  const leaveGroup = async (groupID: string): Promise<boolean> => {
    setIsLeaving(true);
    try {
      await api.post(UrlConstants.leaveGroup, { groupID });
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
    leaveGroup,
    reportGroup,
    markAsCompleted,
    shareGroup,
    isLeaving,
    isReporting,
    isMarkingComplete,
  };
};