import { api } from '@/api/client';
import { useAuthStore } from '@/state/authStore';
import { useTarpsStore } from '@/state/tarpsStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';

export const useUnseenTarps = () => {
    const { setUnseenCount } = useTarpsStore();
    const { isAuthenticated } = useAuthStore();

    const checkUnseen = async () => {
        if (!isAuthenticated) return;

        try {
            // 1. Get previewed posts AND reported posts
            const [previewedJson, reportedJson] = await Promise.all([
                AsyncStorage.getItem('previewedPosts'),
                AsyncStorage.getItem('reportedPosts')
            ]);

            const previewed = new Set(JSON.parse(previewedJson || '[]'));
            const reported = new Set(JSON.parse(reportedJson || '[]'));

            // 2. Fetch global posts (same logic as in tarps.tsx)
            const worldViewport = {
                minLat: -90, maxLat: 90, minLng: -180, maxLng: 180, zoomLevel: 1
            };

            const query = new URLSearchParams({
                minLat: worldViewport.minLat.toString(),
                maxLat: worldViewport.maxLat.toString(),
                minLng: worldViewport.minLng.toString(),
                maxLng: worldViewport.maxLng.toString(),
                zoomLevel: worldViewport.zoomLevel.toString(),
            });

            const res = await api.get(`/tarps/posts?${query.toString()}`);
            const list = (res as any).data?.data || (res as any).data?.posts || (res as any).data;

            if (!Array.isArray(list)) return;

            // 3. flatten clusters/grids if necessary to get individual IDs
            let allIds: string[] = [];

            // Standardize extracting IDs similar to tarps.tsx
            const looksLikeGrid = list.length > 0 && "result" in list[0];

            if (looksLikeGrid) {
                list.forEach((cell: any) => {
                    if (Array.isArray(cell.result)) {
                        cell.result.forEach((item: any) => {
                            if (item.id) allIds.push(String(item.id));
                        });
                    }
                });
            } else {
                list.forEach((p: any) => {
                    // If it has items, treat it as a cluster and only count the items
                    if (p.items && Array.isArray(p.items) && p.items.length > 0) {
                        p.items.forEach((item: any) => {
                            if (item.id) allIds.push(String(item.id));
                        });
                    } else {
                        // Otherwise treat p itself as the post
                        if (p.id) allIds.push(String(p.id));
                    }
                });
            }

            // Filter unique
            allIds = [...new Set(allIds)];

            // 4. Count unseen (excluding reported posts)
            // Determine which IDs are actually unseen for debugging
            const unseenIds = allIds.filter(id => !previewed.has(id) && !reported.has(id));
            const unseen = unseenIds.length;

            if (unseen > 0) {
                console.log(`🌍 Global unseen check: ${unseen} unseen posts. IDs:`, unseenIds);
            } else {
                console.log(`🌍 Global unseen check: 0 unseen posts`);
            }

            setUnseenCount(unseen);

        } catch (error) {
            console.error('Failed to check unseen tarps:', error);
        }
    };

    useEffect(() => {
        checkUnseen();

        // Optional: Poll every few minutes?
        // For now, run once on mount/auth change
    }, [isAuthenticated]);

    return { refreshUnseen: checkUnseen };
};