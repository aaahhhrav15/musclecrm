import * as React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ReelsService, Reel } from '@/services/ReelsService';
 
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function ReelsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [file, setFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [caption, setCaption] = React.useState('');
  const [isUploading, setIsUploading] = React.useState(false);
  const [progress, setProgress] = React.useState<number>(0);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [expandedCaption, setExpandedCaption] = React.useState<Record<string, boolean>>({});

  const { data: myReels = [], refetch } = useQuery<Reel[]>({
    queryKey: ['myReels'],
    queryFn: () => ReelsService.listMyReels(),
  });

  

  const onUpload = async () => {
    if (!file) {
      toast({ title: 'Error', description: 'Please select a video file', variant: 'destructive' });
      return;
    }
    setIsUploading(true);
    setProgress(0);
    try {
      await ReelsService.uploadReel({ file, caption, onProgress: setProgress });
      toast({ title: 'Success', description: 'Reel uploaded successfully' });
      setFile(null);
      setCaption('');
      setProgress(0);
      await refetch();
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Upload failed', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <Card className="shadow-lg border-0">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg font-semibold">Upload Reel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Video</label>
                <Input ref={fileInputRef} type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <p className="text-xs text-muted-foreground">Supported: mp4, mov, webm, mkv (max ~200MB)</p>
              </div>
              <div className="space-y-2 lg:col-span-2">
                <label className="text-sm font-medium">Caption</label>
                <Textarea placeholder="Write an engaging caption..." value={caption} onChange={(e) => setCaption(e.target.value)} className="min-h-[90px]" />
              </div>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded">
                  <div className="h-2 bg-primary rounded transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={onUpload} disabled={isUploading || !file} className="min-w-28">
                {isUploading ? 'Uploading...' : 'Upload'}
              </Button>
              <Button variant="outline" onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; setCaption(''); setProgress(0); }} disabled={isUploading}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg font-semibold">Reels Uploaded</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {myReels.map((r) => (
                <div key={r._id} className="rounded-lg border bg-card overflow-hidden shadow-sm">
                  <div className="aspect-[9/16] bg-black">
                    <video
                      controls
                      className="w-full h-full object-contain"
                      src={`https://musclecrm-images.s3.ap-south-1.amazonaws.com/${r.s3Key}`}
                    />
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="text-sm">
                      <p className={expandedCaption[r._id] ? '' : 'line-clamp-2'}>
                        {r.caption || 'No caption'}
                      </p>
                      {(r.caption && r.caption.length > 120) && (
                        <button
                          type="button"
                          className="mt-1 text-xs text-primary hover:underline"
                          onClick={() => setExpandedCaption(prev => ({ ...prev, [r._id]: !prev[r._id] }))}
                        >
                          {expandedCaption[r._id] ? 'Show less' : 'Show more'}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</p>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive" disabled={deletingId === r._id}>Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this reel?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. The video will be removed from your gym and storage.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={async () => {
                                try {
                                  setDeletingId(r._id);
                                  await ReelsService.deleteReel(r._id);
                                  toast({ title: 'Deleted', description: 'Reel deleted successfully' });
                                  await refetch();
                                } catch (e: any) {
                                  toast({ title: 'Error', description: e?.message || 'Failed to delete', variant: 'destructive' });
                                } finally {
                                  setDeletingId(null);
                                }
                              }}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
              {myReels.length === 0 && (
                <div className="text-sm text-muted-foreground">No reels uploaded yet.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}


