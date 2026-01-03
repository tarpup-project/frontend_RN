import { api } from "@/api/client";
import { UrlConstants } from "@/constants/apiUrls";
import { useAuthStore } from "@/state/authStore";
import { useEffect, useState } from "react";

interface Friend {
  id: string;
  fname: string;
  lname: string | null;
  bgUrl: string | null;
}

interface FriendRequest {
  id: string;
  status: string;
  userID: string;
  friendID: string;
  locationVisible: boolean;
  createdAt: string;
  updatedAt: string;
  friend: Friend;
}

interface FriendRequestsResponse {
  status: string;
  data: FriendRequest[];
}

export const useFriendRequests = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());

  const fetchFriendRequests = async () => {
    if (!isAuthenticated || !user) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get<FriendRequestsResponse>(UrlConstants.friendRequests);
      
      console.log("Friend Requests API Response:", response.data);
      
      if (response.data.status === "success") {
        const requests = response.data.data || [];
        console.log("Parsed friend requests:", requests);
        console.log("Number of friend requests:", requests.length);
        setFriendRequests(requests);
      } else {
        console.log("API returned non-success status:", response.data.status);
        setError("Failed to fetch friend requests");
      }
    } catch (error: any) {
      console.error("Failed to fetch friend requests:", error);
      setError(error?.response?.data?.message || "Failed to fetch friend requests");
      setFriendRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    if (processingRequests.has(requestId)) return; // Prevent double-clicks
    
    try {
      setProcessingRequests(prev => new Set(prev).add(requestId));
      console.log("Accepting friend request:", requestId);
      
      // Find the request to get the friendID (userID of the person who sent the request)
      const request = friendRequests.find(req => req.id === requestId);
      if (!request) {
        console.error("Friend request not found:", requestId);
        return;
      }

      const response = await api.post(UrlConstants.friendRequestAction, {
        userID: request.friendID, // The ID of the user who sent the request
        action: "accept"
      });

      console.log("Accept friend request response:", response.data);

      if (response.data.status === "success") {
        // Remove from local state after successful accept
        setFriendRequests(prev => prev.filter(req => req.id !== requestId));
        console.log("Friend request accepted successfully");
      } else {
        console.error("Failed to accept friend request:", response.data);
      }
    } catch (error: any) {
      console.error("Failed to accept friend request:", error);
      console.error("Error response:", error?.response?.data);
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const declineFriendRequest = async (requestId: string) => {
    if (processingRequests.has(requestId)) return; // Prevent double-clicks
    
    try {
      setProcessingRequests(prev => new Set(prev).add(requestId));
      console.log("Declining friend request:", requestId);
      
      // Find the request to get the friendID (userID of the person who sent the request)
      const request = friendRequests.find(req => req.id === requestId);
      if (!request) {
        console.error("Friend request not found:", requestId);
        return;
      }

      const response = await api.post(UrlConstants.friendRequestAction, {
        userID: request.friendID, // The ID of the user who sent the request
        action: "decline"
      });

      console.log("Decline friend request response:", response.data);

      if (response.data.status === "success") {
        // Remove from local state after successful decline
        setFriendRequests(prev => prev.filter(req => req.id !== requestId));
        console.log("Friend request declined successfully");
      } else {
        console.error("Failed to decline friend request:", response.data);
      }
    } catch (error: any) {
      console.error("Failed to decline friend request:", error);
      console.error("Error response:", error?.response?.data);
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchFriendRequests();
    } else {
      setFriendRequests([]);
      setError(null);
    }
  }, [isAuthenticated, user]);

  // Refresh every 30 seconds
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const interval = setInterval(() => {
      fetchFriendRequests();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  return {
    friendRequests,
    isLoading,
    error,
    processingRequests,
    refetchFriendRequests: fetchFriendRequests,
    acceptFriendRequest,
    declineFriendRequest,
  };
};