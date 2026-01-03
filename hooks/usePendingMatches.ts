import { api } from "@/api/client";
import { UrlConstants } from "@/constants/apiUrls";
import { useAuthStore } from "@/state/authStore";
import { useEffect, useState } from "react";

interface PendingMatch {
  id: string;
  categoryID: string;
  userID: string;
  matchedUserID: string;
  compatibility: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  matchedUser?: {
    id: string;
    fname: string;
    lname: string | null;
    bgUrl: string | null;
  };
  category?: {
    id: string;
    name: string;
    icon: string;
    bgColor: string;
    iconColor: string;
  };
}

interface PendingMatchesResponse {
  status: string;
  data: PendingMatch[];
}

export const usePendingMatches = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [pendingMatches, setPendingMatches] = useState<PendingMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingMatches = async () => {
    if (!isAuthenticated || !user) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get<PendingMatchesResponse>(UrlConstants.pendingMatches);
      
      console.log("Pending Matches API Response:", JSON.stringify(response.data, null, 2));
      
      if (response.data.status === "success") {
        const matches = response.data.data || [];
        console.log("Parsed pending matches:", JSON.stringify(matches, null, 2));
        console.log("Number of pending matches:", matches.length);
        setPendingMatches(matches);
      } else {
        console.log("API returned non-success status:", response.data.status);
        setError("Failed to fetch pending matches");
      }
    } catch (error: any) {
      console.error("Failed to fetch pending matches:", error);
      console.error("Error response:", JSON.stringify(error?.response?.data, null, 2));
      setError(error?.response?.data?.message || "Failed to fetch pending matches");
      setPendingMatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  const markMatchAsViewed = async (matchId: string) => {
    try {
      console.log("Marking match as viewed:", matchId);
      // Remove from local state after viewing
      setPendingMatches(prev => prev.filter(match => match.id !== matchId));
    } catch (error) {
      console.error("Failed to mark match as viewed:", error);
    }
  };

  const dismissMatch = async (matchId: string) => {
    try {
      console.log("Dismissing match:", matchId);
      // Remove from local state after dismissing
      setPendingMatches(prev => prev.filter(match => match.id !== matchId));
    } catch (error) {
      console.error("Failed to dismiss match:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchPendingMatches();
    } else {
      setPendingMatches([]);
      setError(null);
    }
  }, [isAuthenticated, user]);

  // Refresh every 60 seconds
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const interval = setInterval(() => {
      fetchPendingMatches();
    }, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  return {
    pendingMatches,
    data: pendingMatches.map(match => ({
      ...match,
      // Add compatibility properties for existing components
      request: {
        title: match.category?.name || 'Activity',
        description: `Match with ${match.matchedUser?.fname || 'Someone'}`,
        owner: {
          fname: match.matchedUser?.fname || 'Unknown',
          lname: match.matchedUser?.lname || '',
        }
      },
      group: {
        name: match.category?.name || 'Activity',
        description: `${match.compatibility}% compatible match`
      },
      similarityScore: match.compatibility || 0,
    })), // For compatibility with existing components
    isLoading,
    error,
    refetchPendingMatches: fetchPendingMatches,
    markMatchAsViewed,
    dismissMatch,
  };
};

// Separate hook for match actions (for compatibility with existing components)
export const useMatchAction = () => {
  const [isLoading, setIsLoading] = useState(false);

  const mutateAsync = async (action: { matchId: string; action: string }) => {
    setIsLoading(true);
    try {
      console.log("Match action:", JSON.stringify(action, null, 2));
      
      // Simulate API call - you can implement the actual endpoint here
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("Match action completed successfully");
      
      // Return a response structure that the component expects
      return {
        success: true,
        data: {
          group: {
            id: `group_${action.matchId}_${Date.now()}`, // Generate a mock group ID
          },
          groupId: `group_${action.matchId}_${Date.now()}`,
        }
      };
    } catch (error) {
      console.error("Match action failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    mutateAsync,
    isLoading,
  };
};