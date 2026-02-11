import { api } from '@/api/client';
import { UrlConstants } from '@/constants/apiUrls';
import { Group } from '@/types/groups';
import { useRouter } from 'expo-router';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface CampusRequestProps {
    id: string;          // Request ID
    score: string;       // Match score (0-1)
    title: string;       // Request title
    description: string; // Request description
    startTime: string;   // Request start time
    userFname: string;   // Creator's first name
    userID: string;      // Creator's user ID
}

interface RequestDetails {
    id: string;
    group?: Group;  // Group if match accepted
    currState: "pending" | "rejected" | "accepted";
    requestID?: string;
}

export const CampusRequest = ({
    id, score, title, description, startTime, userFname, userID
}: CampusRequestProps) => {
    const [requestDetails, setRequestDetails] = useState<RequestDetails | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (showModal) {
            fetchRequestDetails();
        }
    }, [showModal]);

    const fetchRequestDetails = async () => {
        try {
            setIsLoading(true);
            const response = await api.get(UrlConstants.fetchRequestDetails(id));
            setRequestDetails(response.data.data ?? null);
        } catch (err) {
            console.error("Failed to fetch request details:", err);
            setRequestDetails(null);
        } finally {
            setIsLoading(false);
        }
    };

    const submitRequest = async () => {
        if (requestDetails === undefined) return;
        try {
            setIsSubmitting(true);
            await api.post(UrlConstants.submitRequest, { requestID: id });
            await fetchRequestDetails();  // Refresh to get updated state
        } catch (err) {
            Alert.alert("Error", "Failed to submit request");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenChat = () => {
        setShowModal(false);
        if (requestDetails?.group?.id) {
            router.push(`/group-chat/${requestDetails.group.id}`);
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
                        <Text style={styles.modalDate}>
                            {moment(startTime).format("Do MMM, YYYY")}
                        </Text>

                        {/* Loading State */}
                        {isLoading && (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator color="#16a34a" />
                                <Text style={styles.loadingText}>Loading details...</Text>
                            </View>
                        )}

                        {/* Actions based on state */}
                        {!isLoading && (
                            <>
                                {/* State 2: New Request (Not Yet Matched) */}
                                {requestDetails === null && (
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={submitRequest}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text style={styles.actionButtonText}>Match Request</Text>
                                        )}
                                    </TouchableOpacity>
                                )}

                                {/* State 3: Pending (Awaiting Approval) */}
                                {requestDetails?.currState === "pending" && (
                                    <View style={[styles.statusButton, styles.pendingBorder]}>
                                        <Text style={styles.pendingText}>Awaiting Approval</Text>
                                    </View>
                                )}

                                {/* State 4: Rejected (Declined) */}
                                {requestDetails?.currState === "rejected" && (
                                    <View style={[styles.statusButton, styles.rejectedBorder]}>
                                        <Text style={styles.rejectedText}>Declined</Text>
                                    </View>
                                )}

                                {/* State 5: Accepted (Match Created) */}
                                {requestDetails &&
                                    !["pending", "rejected"].includes(requestDetails.currState) && (
                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={handleOpenChat}
                                        >
                                            <Text style={styles.actionButtonText}>Open Chat</Text>
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
        backgroundColor: '#16a34a',
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
        marginBottom: 12,
        color: '#4b5563',
        lineHeight: 20,
    },
    modalDate: {
        fontSize: 12,
        color: '#9ca3af',
        marginBottom: 20,
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
        backgroundColor: '#16a34a', // green-600
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
    statusButton: {
        width: '100%',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginBottom: 12,
        alignItems: 'center',
        borderWidth: 1,
    },
    pendingBorder: {
        borderColor: '#fb923c', // orange-400
    },
    pendingText: {
        color: '#fb923c',
        fontWeight: '600',
    },
    rejectedBorder: {
        borderColor: '#dc2626', // red-600
    },
    rejectedText: {
        color: '#dc2626',
        fontWeight: '600',
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