import { api } from "@/api/client";
import { UrlConstants } from "@/constants/apiUrls";
import { FetchUserProfile } from "@/types/auth";
import { useQuery } from "@tanstack/react-query";

interface UserProfileResponse {
    status: string;
    data: FetchUserProfile;
}

const fetchFullUserProfile = async (userId: string): Promise<FetchUserProfile> => {
    try {
        console.log("👤 Fetching FULL user profile details for:", userId);
        const url = UrlConstants.fetchUserProfile(userId);
        console.log("🔗 API endpoint:", url);

        const response = await api.get<UserProfileResponse>(url);

        if (response.data?.status === "success" && response.data?.data) {
            console.log("✅ Full user profile details fetched successfully");
            return response.data.data;
        }

        throw new Error("Invalid profile response");
    } catch (error: any) {
        console.error("❌ Failed to fetch full user profile details:", error);
        throw error;
    }
};

export const useFullUserProfile = (userId: string | null | undefined) => {
    return useQuery<FetchUserProfile, Error>({
        queryKey: ["fullUserProfile", userId],
        queryFn: () => fetchFullUserProfile(userId!),
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 2,
    });
};
