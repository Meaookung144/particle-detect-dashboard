'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Download, 
  RefreshCw, 
  AlertTriangle, 
  Image as ImageIcon,
  Server,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize,
  FileDown
} from 'lucide-react';
import { formatDate, timeAgo, getStatusColor, getFilename } from '@/lib/utils';

export default function ImageDetailPage({
  params
}: {
  params: { id: string }
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [image, setImage] = useState<any>(null);
  const [machine, setMachine] = useState<any>(null);
  const [particles, setParticles] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // Server path to image files (in a real app, this would be a proper API endpoint)
  const getImagePath = (filename: string) => `/api/images/file/${filename}`;
  
  const fetchImageData = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch image details
      const { data: imageData, error: imageError } = await supabase
        .from('images')
        .select('*')
        .eq('id', params.id)
        .single();
      
      if (imageError) throw imageError;
      
      // Fetch machine details
      const { data: machineData, error: machineError } = await supabase
        .from('machines')
        .select('*')
        .eq('id', imageData.machine_id)
        .single();
      
      if (machineError) throw machineError;
      
      // Fetch particles
      const { data: particlesData, error: particlesError } = await supabase
        .from('particles')
        .select('*')
        .eq('image_id', params.id)
        .order('created_at', { ascending: true });
      
      if (particlesError) throw particlesError;
      
      // Set state
      setImage(imageData);
      setMachine(machineData);
      setParticles(particlesData || []);
    } catch (error: any) {
      console.error('Error fetching image data:', error);
      setError('Failed to load image data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const refreshData = async () => {
    setRefreshing(true);
    await fetchImageData();
    setRefreshing(false);
  };
  
  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };
  
  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };
  
  const resetZoom = () => {
    setZoomLevel(1);
  };

  useEffect(() => {
    fetchImageData();
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
        <h2 className="text-xl font-bold mb-2">Error Loading Image</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={refreshData}>Try Again</Button>
      </div>
    );
  }

  if (!image) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
        <ImageIcon className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
        <h2 className="text-xl font-bold mb-2">Image Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The image you're looking for doesn't exist or you don't have access to it.
        </p>
        <Button asChild>
          <Link href="/images">Back to Images</Link>
        </Button>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (image.status) {
      case 'detected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header navigation */}
      <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 w-8 p-0 mr-1"
          asChild
        >
          <Link href="/images">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <Link href="/images" className="hover:underline">
          Images
        </Link>
        <ChevronRight className="h-4 w-4 mx-1" />
        <Link href={`/machines/${machine.id}`} className="hover:underline">
          {machine.name}
        </Link>
        <ChevronRight className="h-4 w-4 mx-1" />
        <span className="font-medium text-foreground truncate max-w-xs">
          {getFilename(image.original_filename)}
        </span>
      </div>
      
      {/* Image details header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">
              Image Details
            </h2>
            <div className={`px-2 py-1 rounded-full text-xs flex items-center ${
              image.status === 'detected' ? 'bg-green-500/10 text-green-500' :
              image.status === 'failed' ? 'bg-red-500/10 text-red-500' :
              'bg-yellow-500/10 text-yellow-500'
            }`}>
              <span className={`h-2 w-2 rounded-full mr-1 ${getStatusColor(image.status)}`}></span>
              {image.status.charAt(0).toUpperCase() + image.status.slice(1)}
            </div>
          </div>
          <p className="text-muted-foreground mt-1">
            Uploaded {timeAgo(image.uploaded_at)}
          </p>
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
            size="sm"
            asChild
          >
            <a href={getImagePath(image.original_filename)} download>
              <FileDown className="h-4 w-4 mr-2" />
              Download
            </a>
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Image preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="border rounded-lg overflow-hidden bg-card">
            <div className="p-4 bg-muted/50 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                <h3 className="font-medium">Image Preview</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={zoomOut}
                  disabled={zoomLevel <= 0.5}
                >
                  <ZoomOut className="h-4 w-4" />
                  <span className="sr-only">Zoom Out</span>
                </Button>
                <span className="text-xs">{Math.round(zoomLevel * 100)}%</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={zoomIn}
                  disabled={zoomLevel >= 3}
                >
                  <ZoomIn className="h-4 w-4" />
                  <span className="sr-only">Zoom In</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={resetZoom}
                  disabled={zoomLevel === 1}
                >
                  <Maximize className="h-4 w-4" />
                  <span className="sr-only">Reset Zoom</span>
                </Button>
              </div>
            </div>
            
            <div className="relative overflow-auto" style={{ maxHeight: '600px' }}>
              <div className="flex justify-center p-4">
                <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center', transition: 'transform 0.2s' }}>
                  {/* In a real app, this would be a proper image from your server */}
                  <div className="bg-muted rounded flex items-center justify-center" style={{ width: '800px', height: '600px' }}>
                    <ImageIcon className="h-16 w-16 text-muted-foreground opacity-20" />
                    <span className="sr-only">Image preview not available in this demo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Particle detection visualization would go here */}
          {image.status === 'detected' && particles.length > 0 && (
            <div className="border rounded-lg overflow-hidden bg-card">
              <div className="p-4 bg-muted/50 border-b flex items-center gap-2">
                <Search className="h-4 w-4" />
                <h3 className="font-medium">Detected Particles</h3>
              </div>
              
              <div className="p-4">
                {/* In a real app, this would show the original image with bounding boxes for particles */}
                <div className="text-sm text-muted-foreground text-center py-8">
                  Particle detection visualization would be shown here
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Image details and particle list */}
        <div className="space-y-6">
          {/* Image details */}
          <div className="border rounded-lg overflow-hidden bg-card">
            <div className="p-4 bg-muted/50 border-b flex items-center gap-2">
              <Server className="h-4 w-4" />
              <h3 className="font-medium">Details</h3>
            </div>
            
            <div className="p-4 space-y-4">
              <dl className="grid grid-cols-2 gap-1 text-sm">
                <dt className="text-muted-foreground">Status</dt>
                <dd className="font-medium flex items-center">
                  {getStatusIcon()}
                  <span className="ml-1">{image.status.charAt(0).toUpperCase() + image.status.slice(1)}</span>
                </dd>
                
                <dt className="text-muted-foreground">Machine</dt>
                <dd className="font-medium">
                  <Link href={`/machines/${machine.id}`} className="hover:underline">
                    {machine.name}
                  </Link>
                </dd>
                
                <dt className="text-muted-foreground">Uploaded</dt>
                <dd className="font-medium">{formatDate(image.uploaded_at)}</dd>
                
                <dt className="text-muted-foreground">Processing Time</dt>
                <dd className="font-medium">
                  {image.processed_at ? 
                    `${Math.round((new Date(image.processed_at).getTime() - new Date(image.uploaded_at).getTime()) / 1000)}s` : 
                    'Not processed yet'}
                </dd>
                
                <dt className="text-muted-foreground">Particles</dt>
                <dd className="font-medium">{image.detection_count || 0}</dd>
                
                <dt className="text-muted-foreground">Filename</dt>
                <dd className="font-medium truncate">{image.original_filename}</dd>
              </dl>
            </div>
          </div>
          
          {/* Particles */}
          <div className="border rounded-lg overflow-hidden bg-card">
            <div className="p-4 bg-muted/50 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                <h3 className="font-medium">Detected Particles</h3>
              </div>
              <div className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                {particles.length} particles
              </div>
            </div>
            
            {image.status === 'pending' ? (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 mx-auto mb-4 text-yellow-500 animate-spin" />
                <h4 className="font-medium mb-1">Processing Image</h4>
                <p className="text-sm text-muted-foreground">
                  Particle detection is in progress
                </p>
              </div>
            ) : image.status === 'failed' ? (
              <div className="p-8 text-center">
                <XCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
                <h4 className="font-medium mb-1">Detection Failed</h4>
                <p className="text-sm text-muted-foreground">
                  Could not process the image. Please try again.
                </p>
              </div>
            ) : particles.length === 0 ? (
              <div className="p-8 text-center">
                <Search className="h-8 w-8 mx-auto mb-4 text-muted-foreground opacity-20" />
                <h4 className="font-medium mb-1">No Particles Detected</h4>
                <p className="text-sm text-muted-foreground">
                  No particles were found in this image
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {particles.map((particle) => (
                  <div key={particle.id} className="p-4 hover:bg-muted/30">
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground opacity-50" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate capitalize">
                          {particle.class} Particle
                        </p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <span>{particle.confidence ? `${Math.round(particle.confidence * 100)}% confidence` : 'N/A'}</span>
                          <span className="mx-1">•</span>
                          <span>{particle.width}×{particle.height}px</span>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                      >
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Download</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}