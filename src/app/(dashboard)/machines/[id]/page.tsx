'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  Server, 
  Settings, 
  Upload, 
  Eye, 
  Clock, 
  Image as ImageIcon,
  BarChart,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  FileDown
} from 'lucide-react';
import { formatDate, timeAgo, getStatusColor } from '@/lib/utils';

export default function MachineDetailPage({
  params
}: {
  params: { id: string }
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [machine, setMachine] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMachineData = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch machine details
      const { data: machineData, error: machineError } = await supabase
        .from('machines')
        .select('*')
        .eq('id', params.id)
        .single();
      
      if (machineError) throw machineError;
      
      // Fetch recent images
      const { data: imagesData, error: imagesError } = await supabase
        .from('images')
        .select('*')
        .eq('machine_id', params.id)
        .order('uploaded_at', { ascending: false })
        .limit(10);
      
      if (imagesError) throw imagesError;
      
      // Fetch stats
      const { data: summaryData, error: summaryError } = await supabase
        .from('dashboard_summary')
        .select('*')
        .eq('machine_id', params.id)
        .single();
      
      if (summaryError && summaryError.code !== 'PGRST116') throw summaryError;
      
      // Set state
      setMachine(machineData);
      setImages(imagesData || []);
      setStats(summaryData || {
        total_images: 0,
        total_particles: 0,
        pending_images: 0,
        detected_images: 0,
        failed_images: 0
      });
    } catch (error: any) {
      console.error('Error fetching machine data:', error);
      setError('Failed to load machine data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const refreshData = async () => {
    setRefreshing(true);
    await fetchMachineData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchMachineData();
  }, [params.id, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="loading-spinner">
          <div></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Error Loading Machine</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={refreshData}>Try Again</Button>
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
        <Server className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
        <h2 className="text-xl font-bold mb-2">Machine Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The machine you're looking for doesn't exist or you don't have access to it.
        </p>
        <Button asChild>
          <Link href="/machines">Back to Machines</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center">
            <h2 className="text-3xl font-bold tracking-tight mr-3">
              {machine.name}
            </h2>
            <div className={`px-2 py-1 rounded-full text-xs flex items-center ${
              machine.status === 'active' ? 'bg-green-500/10 text-green-500' :
              machine.status === 'inactive' ? 'bg-red-500/10 text-red-500' :
              'bg-yellow-500/10 text-yellow-500'
            }`}>
              <span className={`h-2 w-2 rounded-full mr-1 ${getStatusColor(machine.status)}`}></span>
              {machine.status.charAt(0).toUpperCase() + machine.status.slice(1)}
            </div>
          </div>
          {machine.description && (
            <p className="text-muted-foreground mt-1">
              {machine.description}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <Link href={`/machines/${params.id}/settings`}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
          <Button
            size="sm"
            asChild
          >
            <Link href={`/machines/${params.id}/upload`}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Image
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats overview */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Images</p>
            <ImageIcon className="h-4 w-4 text-blue-500" />
          </div>
          <h3 className="text-2xl font-bold">{stats.total_images || 0}</h3>
        </div>
        
        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Particles</p>
            <BarChart className="h-4 w-4 text-purple-500" />
          </div>
          <h3 className="text-2xl font-bold">{stats.total_particles || 0}</h3>
        </div>
        
        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Upload Interval</p>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <h3 className="text-2xl font-bold">{machine.upload_interval_seconds}s</h3>
        </div>
        
        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Detection Rate</p>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold">
            {stats.total_images ? 
              `${Math.round((stats.total_particles / stats.total_images) * 100) / 100}` : 
              '0'}
          </h3>
        </div>
      </div>

      {/* Status cards */}
      <div className="grid gap-4 grid-cols-3">
        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
            <p className="text-sm font-medium">Pending</p>
          </div>
          <h3 className="text-xl font-bold">{stats.pending_images || 0}</h3>
        </div>
        
        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
            <p className="text-sm font-medium">Detected</p>
          </div>
          <h3 className="text-xl font-bold">{stats.detected_images || 0}</h3>
        </div>
        
        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-3 w-3 rounded-full bg-red-500"></div>
            <p className="text-sm font-medium">Failed</p>
          </div>
          <h3 className="text-xl font-bold">{stats.failed_images || 0}</h3>
        </div>
      </div>

      {/* Recent uploads */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Recent Uploads</h3>
          <Button asChild variant="outline" size="sm">
            <Link href={`/images?machine=${params.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Link>
          </Button>
        </div>
        
        {images.length === 0 ? (
          <div className="border rounded-lg p-8 text-center bg-card">
            <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <h3 className="font-medium mb-2">No images uploaded yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload your first image or wait for automatic uploads
            </p>
            <Button asChild>
              <Link href={`/machines/${params.id}/upload`}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Image
              </Link>
            </Button>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Filename</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">Particles</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Uploaded</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {images.map((image) => (
                    <tr key={image.id} className="hover:bg-muted/30">
                      <td className="py-3 px-4">
                        <Link 
                          href={`/images/${image.id}`} 
                          className="font-medium hover:underline truncate block max-w-xs"
                        >
                          {image.original_filename}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <span className={`h-2 w-2 rounded-full mr-2 ${getStatusColor(image.status)}`}></span>
                          <span>
                            {image.status.charAt(0).toUpperCase() + image.status.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {image.detection_count || 0}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {timeAgo(image.uploaded_at)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button asChild size="sm" variant="outline" className="h-8 w-8 p-0">
                            <Link href={`/images/${image.id}`}>
                              <span className="sr-only">View</span>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                            <span className="sr-only">Download</span>
                            <FileDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}