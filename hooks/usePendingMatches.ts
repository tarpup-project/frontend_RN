import { api } from "@/api/client";
import { UrlConstants } from "@/constants/apiUrls";
import { useAuthStore } from "@/state/authStore";
import { useEffect, useState } from "react";

interface UserPendingMatchesInterface {
  id: string;
  requestID: string;
  groupID?: string | null;
  creatorID: string;
  createdAt: string;
  request?: {
    id: string;
    title: string;
    description: string;
    owner: {
      id: string;
      fname: string;
    };
    createdAt: string;
  };
  group?: {
    id: string;
    name: string;
    description: string;
    creator: {
      id: string;
      fname: string;
    };
    createdAt: string;
  };
  similarityScore: number; // Match compatibility percentage
}

interface SingleMatchInterface {
  id: string;
  group?: any; // FetchAllGroupsInterface
  currState: "pending" | "rejected" | "accepted"; // Match status
  requestID?: string;
}

interface PendingMatchesResponse {
  status: string;
  data: UserPendingMatchesInterface[];
}

export const usePendingMatches = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [pendingMatches, setPendingMatches] = useState<UserPendingMatchesInterface[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingMatches = async () => {
    if (!isAuthenticated || !user) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get<PendingMatchesResponse>(UrlConstants.pendingMatches);
      
      console.log("Pending Matches API Response:", JSON.stringify(response.data, null, 2));
      
      // Handle different response structures
      if (response.data && typeof response.data === 'object') {
        if (response.data.status === "success") {
          const matches = response.data.data || [];
          
          // Validate that matches is an array
          if (!Array.isArray(matches)) {
            console.warn("API returned non-array data:", matches);
            console.log("Parsed pending matches: Invalid data type");
            console.log("Number of pending matches: 0");
            setPendingMatches([]);
            return;
          }
          
          console.log("Parsed pending matches:", JSON.stringify(matches, null, 2));
          console.log("Number of pending matches:", matches.length);
          setPendingMatches(matches);
        } else {
          console.log("API returned non-success status:", response.data.status);
          setError("Failed to fetch pending matches");
          setPendingMatches([]);
        }
      } else {
        // Handle case where response.data is not an object (like a string)
        console.warn("API returned unexpected response format:", response.data);
        console.log("Parsed pending matches: Invalid response format");
        console.log("Number of pending matches: 0");
        setError("Invalid response format from server");
        setPendingMatches([]);
      }
    } catch (error: any) {
      console.error("Failed to fetch pending matches:", error);
      console.error("Error response:", JSON.stringify(error?.response?.data, null, 2));
      
      // Check if it's a 404 error (endpoint doesn't exist)
      if (error?.response?.status === 404) {
        console.log("Pending matches endpoint not found, using empty data");
        setError(null); // Don't show error for missing endpoint
        setPendingMatches([]);
      } else {
        setError(error?.response?.data?.message || "Failed to fetch pending matches");
        setPendingMatches([]);
      }
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
    pendingMatches: Array.isArray(pendingMatches) ? pendingMatches : [],
    data: Array.isArray(pendingMatches) ? pendingMatches.map(match => ({
      ...match,
      // Add compatibility properties for existing components
      request: match.request || {
        title: match.group?.name || 'Activity',
        description: match.group?.description || `Match with compatibility`,
        owner: {
          fname: match.group?.creator?.fname || 'Unknown',
          lname: '',
        }
      },
      group: match.group || {
        name: match.request?.title || 'Activity',
        description: `${match.similarityScore}% compatible match`
      },
      similarityScore: match.similarityScore || 0,
    })) : [], // For compatibility with existing components
    isLoading,
    error,
    refetchPendingMatches: fetchPendingMatches,
    markMatchAsViewed,
    dismissMatch,
  };
};

// Match action hook for handling accept/decline actions
export const useMatchAction = () => {
  const [isLoading, setIsLoading] = useState(false);

  const mutateAsync = async (action: { matchId: string; action: "private" | "public" | "decline" | "add" }) => {
    setIsLoading(true);
    try {
      console.log("Match action:", JSON.stringify(action, null, 2));
      
      const response = await api.post(UrlConstants.matchAction(action.matchId), {
        action: action.action
      });
      
      console.log("Match action completed successfully:", response.data);
      
      // Return the response data
      return response.data;
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