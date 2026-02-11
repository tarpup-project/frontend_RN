import { api } from '@/api/client';
import { UrlConstants } from '@/constants/apiUrls';
import { Group } from '@/types/groups';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

    useEffect(() => {
        if (showModal) {
            fetchGroupDetails();
        }
    }, [showModal]);

    const fetchGroupDetails = async () => {
        try {
            setIsLoading(true);
            const response = await api.get(UrlConstants.fetchGroupDetails(id));
            setGroupDetails(response.data.data);
        } catch (err) {
            console.error("Failed to fetch group details:", err);
            // Don't set null here immediately if we want to show basic info, but usually details are richer
        } finally {
            setIsLoading(false);
        }
    };

    const joinGroupRequest = async () => {
        try {
            setIsJoining(true);
            // The prompt says POST to fetchGroupDetails url for joining, which seems odd but adhering to prompt:
            // UrlConstants.fetchGroupDetails(id) returns `/activities/groups/details/${id}`
            // Prompt says: POST /activities/groups/details/{groupID}
            await api.post(UrlConstants.fetchGroupDetails(id), {});
            await fetchGroupDetails();  // Refresh to get updated state (isJoined)
        } catch (err) {
            Alert.alert("Error", "Failed to join group");
        } finally {
            setIsJoining(false);
        }
    };

    const handleOpenChat = () => {
        setShowModal(false);
        if (groupDetails?.id) {
            router.push(`/group-chat/${groupDetails.id}`);
        }
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
                                {groupDetails?.isJoined ? (
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
