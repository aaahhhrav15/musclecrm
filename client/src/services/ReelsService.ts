import { ApiService } from './ApiService';

export interface Reel {
  _id: string;
  caption: string;
  s3Key: string;
  gymId: string;
  createdAt: string;
  updatedAt: string;
}

export const ReelsService = {
  async uploadReel(params: { file: File; caption?: string; onProgress?: (percent: number) => void }): Promise<Reel> {
    const form = new FormData();
    form.append('reel', params.file);
    if (params.caption) form.append('caption', params.caption);

    const res = await ApiService.postRaw('/reels', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (!evt.total) return;
        const percent = Math.round((evt.loaded / evt.total) * 100);
        params.onProgress?.(percent);
      },
    });
    if (!res.success) throw new Error(res.message || 'Failed to upload reel');
    return res.data as Reel;
  },

  async listMyReels(): Promise<Reel[]> {
    const res = await ApiService.get<{ success: boolean; data: Reel[] }>('/reels/mine');
    if (!res.success) throw new Error('Failed to fetch reels');
    return res.data;
  },

  async listGymReels(): Promise<Reel[]> {
    const res = await ApiService.get<{ success: boolean; data: Reel[] }>('/reels');
    if (!res.success) throw new Error('Failed to fetch reels');
    return res.data;
  }
  ,
  async deleteReel(id: string): Promise<void> {
    const res = await ApiService.delete<{ success: boolean }>(`/reels/${id}`);
    if (!res.success) throw new Error('Failed to delete reel');
  }
};

export default ReelsService;


