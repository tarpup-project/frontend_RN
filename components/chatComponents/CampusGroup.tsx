import { api } from '@/api/client';
import { UrlConstants } from '@/constants/apiUrls';
import { useAuthStore } from '@/state/authStore';
import { Group } from '@/types/groups';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface CampusGroupProps {
    id: string;          // Group ID
    score: string;       // Match score
    title: string;       // Group title
    description: string; // Group description
    userFname: string;   // Creator's name
    userID: string;      // Creator's ID
}

export const CampusGroup = ({
    id, score, title, description, userFname, userID
}: CampusGroupProps) => {
    const [groupDetails, setGroupDetails] = useState<Group | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const router = useRouter();
    const { user } = useAuthStore();

    // Check if current user is a member of the group
    const isUserJoined = useMemo(() => {
        if (!groupDetails || !user?.id) return false;
        
        // Check if user is in members array
        const isMember = groupDetails.members?.some(member => member.id === user.id);
        console.log("🔍 CampusGroup: Checking membership. User ID:", user.id, "Is member:", isMember);
        console.log("🔍 CampusGroup: Members:", groupDetails.members?.map(m => m.id));
        
        return isMember || groupDetails.isJoined === true;
    }, [groupDetails, user?.id]);

    useEffect(() => {
        if (showModal) {
            fetchGroupDetails();
        }
    }, [showModal]);

    const fetchGroupDetails = async () => {
        try {
            setIsLoading(true);
            console.log("🔍 CampusGroup: Fetching details for group ID:", id);
            
            try {
                // Try the main details endpoint first
                const response = await api.get(UrlConstants.fetchGroupDetails(id));
                console.log("📦 CampusGroup: Main endpoint response:", JSON.stringify(response.data, null, 2));
                
                if (response.data?.data) {
                    console.log("✅ CampusGroup: Group details fetched successfully");
                    console.log("📦 CampusGroup: isJoined status:", response.data.data?.isJoined);
                    setGroupDetails(response.data.data);
                    return;
                }
            } catch (mainError: any) {
                console.warn("⚠️ CampusGroup: Main endpoint failed, trying fallback:", mainError.response?.status);
                
                // Fallback to invite details endpoint
                try {
                    const fallbackResponse = await api.get(UrlConstants.fetchInviteGroupDetails(id));
                    console.log("📦 CampusGroup: Fallback endpoint response:", JSON.stringify(fallbackResponse.data, null, 2));
                    
                    if (fallbackResponse.data?.data) {
                        console.log("✅ CampusGroup: Group details fetched from fallback");
                        console.log("📦 CampusGroup: isJoined status:", fallbackResponse.data.data?.isJoined);
                        setGroupDetails(fallbackResponse.data.data);
                        return;
                    }
                } catch (fallbackError: any) {
                    console.error("❌ CampusGroup: Fallback also failed:", fallbackError.response?.status);
                    throw mainError;
                }
            }
        } catch (err: any) {
            console.error("❌ CampusGroup: Failed to fetch group details:", err);
            console.error("❌ CampusGroup: Error response:", err.response?.data);
            console.error("❌ CampusGroup: Error status:", err.response?.status);
            setGroupDetails(null);
        } finally {
            setIsLoading(false);
        }
    };

    const joinGroupRequest = async () => {
        try {
            setIsJoining(true);
            console.log("🔄 CampusGroup: Joining group:", id);
            await api.post(UrlConstants.fetchGroupDetails(id), {});
            console.log("✅ CampusGroup: Successfully joined group");
            await fetchGroupDetails();  // Refresh to get updated state (isJoined)
        } catch (err) {
            console.error("❌ CampusGroup: Failed to join group:", err);
            Alert.alert("Error", "Failed to join group");
        } finally {
            setIsJoining(false);
        }
    };

    const handleOpenChat = () => {
        console.log("🔄 CampusGroup: Opening chat for group:", id);
        setShowModal(false);
        router.replace(`/group-chat/${id}`);
    };

    // Parse score to percentage
    const matchPercentage = (parseFloat(score) * 100).toFixed(0);

    return (
        <>
            {/* Compact Card View */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.userName}>{userFname}</Text>
                    <View style={styles.matchBadge}>
                        <Text style={styles.matchText}>{matchPercentage}% Match</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.viewDetailsButton}
                    onPress={() => setShowModal(true)}
                >
                    <Text style={styles.viewDetailsText}>View Details</Text>
                </TouchableOpacity>
            </View>

            {/* Modal with Full Details */}
            <Modal
                visible={showModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalBackdrop}
                    activeOpacity={1}
                    onPress={() => setShowModal(false)}
                >
                    <TouchableOpacity
                        style={styles.modalContent}
                        activeOpacity={1}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <Text style={styles.modalTitle}>{title}</Text>
                        <Text style={styles.modalDescription}>{description}</Text>

                        {/* Loading State */}
                        {isLoading && (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator color="#16a34a" />
                                <Text style={styles.loadingText}>Loading details...</Text>
                            </View>
                        )}

                        {/* Actions */}
                        {!isLoading && (
                            <>
                                {(() => {
                                    console.log("🎯 CampusGroup: Rendering button. isUserJoined:", isUserJoined, "groupDetails:", groupDetails);
                                    return null;
                                })()}
                                {isUserJoined ? (
                                    // State 2: Already Joined
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={handleOpenChat}
                                    >
                                        <Text style={styles.actionButtonText}>Open Chat</Text>
                                    </TouchableOpacity>
                                ) : (
                                    // State 1: Not Joined
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={joinGroupRequest}
                                        disabled={isJoining}
                                    >
                                        {isJoining ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text style={styles.actionButtonText}>Join Group</Text>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </>
                        )}

                        {/* Close button */}
                        <TouchableOpacity
                            onPress={() => setShowModal(false)}
                            style={styles.closeButton}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    card: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        marginVertical: 8,
        backgroundColor: '#fff',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    matchBadge: {
        backgroundColor: '#6b7280',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 16,
    },
    matchText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '600',
    },
    viewDetailsButton: {
        backgroundColor: '#16a34a', // green-600
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center',
    },
    viewDetailsText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        width: '90%',
        maxWidth: 400,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
        color: '#000',
    },
    modalDescription: {
        fontSize: 14,
        marginBottom: 20,
        color: '#4b5563',
        lineHeight: 20,
    },
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 8,
        color: '#6b7280',
    },
    actionButton: {
        backgroundColor: '#16a34a',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    closeButton: {
        marginTop: 4,
        width: '100%',
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#000',
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
});
