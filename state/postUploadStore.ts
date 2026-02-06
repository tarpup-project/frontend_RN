import { api } from '@/api/client';
import { UrlConstants } from '@/constants/apiUrls';
import * as MediaLibrary from 'expo-media-library';
import { toast } from 'sonner-native';
import { create } from 'zustand';

interface PostUploadState {
    isUploading: boolean;
    uploadProgress: number;
    uploadError: string | null;

    // Actions
    uploadPost: (params: {
        selectedImages: string[];
        allMedia: MediaLibrary.Asset[];
        caption: string;
        placeName: string;
    }) => Promise<void>;
    resetUploadState: () => void;
}

export const usePostUploadStore = create<PostUploadState>((set, get) => ({
    isUploading: false,
    uploadProgress: 0,
    uploadError: null,

    uploadPost: async ({ selectedImages, allMedia, caption, placeName }) => {
        try {
            set({ isUploading: true, uploadProgress: 0, uploadError: null });

            // Resolve URIs (logic moved from create-post.tsx)
            const resolvedUris = await Promise.all(
                selectedImages.map(async (uri) => {
                    if (typeof uri === "string" && uri.startsWith("ph://")) {
                        const asset = allMedia.find((a) => a.uri === uri);
                        if (asset) {
                            try {
                                const info = await MediaLibrary.getAssetInfoAsync(asset.id);
                                return (info as any)?.localUri || (info as any)?.uri || uri;
                            } catch (e) {
                                return uri;
                            }
                        }
                    }
                    return uri;
                })
            );

            const form = new FormData();
            resolvedUris.forEach((uri, idx) => {
                form.append("image", {
                    uri,
                    name: `photo_${idx + 1}.jpg`,
                    type: "image/jpeg",
                } as any);
            });
            form.append("caption", caption.trim());
            form.append("address", placeName.trim());

            set({ uploadProgress: 10 }); // Started

            // simulated progress not really possible with axios without config
            // but we can assume it takes a bit

            const res = await api.post(UrlConstants.uploadTarps, form, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                timeout: 120000, // Longer timeout for uploads
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
                    set({ uploadProgress: percentCompleted });
                }
            });

            console.log('✅ Post uploaded successfully');
            toast.success("Posted successfully");

            // We can optionally explicitly refresh the timeline here if we have access to it
            // or rely on the user refreshing / socket updates
            if ((global as any).refreshPostsInView) {
                (global as any).refreshPostsInView();
            }

        } catch (e: any) {
            console.error('❌ Upload failed:', e);
            set({ uploadError: e.message || "Failed to upload post" });
            toast.error("Failed to post photo");
        } finally {
            // Delay setting isUploading to false slightly to let the progress bar hit 100% on UI
            setTimeout(() => {
                set({ isUploading: false });
            }, 1000);
        }
    },

    resetUploadState: () => set({ isUploading: false, uploadProgress: 0, uploadError: null }),
}));