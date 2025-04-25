'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Search, 
  FilterX, 
  Clock,
  Image as ImageIcon,
  RefreshCw,
  Server,
  Eye,
  Download,
  CheckCircle,
  AlertTriangle,
  Loader
} from 'lucide-react';
import { formatDate, timeAgo, getStatusColor, getFilename } from '@/lib/utils';
import { useSearchParams, useRouter } from 'next/navigation';

export default function ImagesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [totalImages, setTotalImages] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [machineFilter, setMachineFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    // Check for URL params
    const machineId = searchParams.get('machine');
    const status = searchParams.get('status');
    const pageParam = searchParams.get('page');
    
    if (machineId) setMachineFilter(machineId);
    if (status) setStatusFilter(status);
    if (pageParam) setPage(parseInt(pageParam));
    
    fetchMachines();
    fetchImages();
  }, [searchParams, user]);

  const fetchMachines = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('machines')
        .select('id, name')
        .order('name', { ascending: true });
      
      if (error) throw error;
      setMachines(data || []);
    } catch (error) {
      console.error('Error fetching machines:', error);
    }
  };

  const fetchImages = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Start building the query
      let query = supabase
        .from('images')
        .select('*, machines(name)', { count: 'exact' });
      
      // Apply filters
      if (machineFilter) {
        query = query.eq('machine_id', machineFilter);
      }
      
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }
      
      if (searchQuery) {
        query = query.ilike('original_filename', `%${searchQuery}%`);
      }
      
      // Add pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      query = query
        .order('uploaded_at', { ascending: false })
        .range(from, to);
      
      // Execute query
      const { data, count, error } = await query;
      
      if (error) throw error;
      
      setImages(data || []);
      setTotalImages(count || 0);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const refreshData = async () => {
    setRefreshing(true);
    await fetchImages();
    setRefreshing(false);
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchImages();
  };
  
  const clearFilters = () => {
    setSearchQuery('');
    setMachineFilter('');
    setStatusFilter('');
    router.push('/images');
    setTimeout(fetchImages, 0);
  };
  
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    
    // Update URL
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    
    if (machineFilter) params.set('machine', machineFilter);
    if (statusFilter) params.set('status', statusFilter);
    
    router.push(`/images?${params.toString()}`);
  };
  
  const updateFilters = (type: 'machine' | 'status', value: string) => {
    if (type === 'machine') {
      setMachineFilter(value);
    } else {
      setStatusFilter(value);
    }
    
    // Update URL
    const params = new URLSearchParams();
    
    if (type === 'machine' && value) params.set('machine', value);
    if (type === 'status' && value) params.set('status', value);
    
    if (type !== 'machine' && machineFilter) params.set('machine', machineFilter);
    if (type !== 'status' && statusFilter) params.set('status', statusFilter);
    
    setPage(1);
    
    router.push(`/images?${params.toString()}`);
  };

  const totalPages = Math.ceil(totalImages / limit);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Images</h2>
          <p className="text-muted-foreground">
            Browse and manage particle detection images
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={refreshing || loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button asChild>
            <Link href="/upload">
              <Plus className="mr-2 h-4 w-4" />
              Upload Image
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by filename..."
              className="w-full pl-9 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="sr-only">Search</button>
          </form>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <select
            className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            value={machineFilter}
            onChange={(e) => updateFilters('machine', e.target.value)}
          >
            <option value="">All Machines</option>
            {machines.map((machine) => (
              <option key={machine.id} value={machine.id}>
                {machine.name}
              </option>
            ))}
          </select>
          
          <select
            className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            value={statusFilter}
            onChange={(e) => updateFilters('status', e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="detected">Detected</option>
            <option value="failed">Failed</option>
          </select>
          
          {(machineFilter || statusFilter || searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="flex items-center"
            >
              <FilterX className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Images grid/list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="loading-spinner">
            <div></div>
          </div>
        </div>
      ) : images.length === 0 ? (
        <div className="border rounded-lg p-8 text-center">
          <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <h3 className="font-medium mb-2">No images found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery || machineFilter || statusFilter ? 
              'Try different search criteria or clear filters' : 
              'Upload your first image to get started'}
          </p>
          {!searchQuery && !machineFilter && !statusFilter && (
            <Button asChild>
              <Link href="/upload">
                <Plus className="mr-2 h-4 w-4" />
                Upload Image
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden bg-card">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Image</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Machine</th>
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
                      <div className="flex items-center">
                        <div className="h-10 w-10 mr-3 bg-muted rounded flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <Link
                          href={`/images/${image.id}`}
                          className="font-medium hover:underline truncate max-w-xs"
                        >
                          {getFilename(image.original_filename)}
                        </Link>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/machines/${image.machine_id}`}
                        className="hover:underline flex items-center"
                      >
                        <Server className="h-3 w-3 mr-1 text-muted-foreground" />
                        {image.machines?.name || 'Unknown'}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <span className={`h-2 w-2 rounded-full mr-2 ${getStatusColor(image.status)}`}></span>
                        <span>
                          {image.status === 'detected' ? (
                            <span className="flex items-center">
                              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                              Detected
                            </span>
                          ) : image.status === 'failed' ? (
                            <span className="flex items-center">
                              <AlertTriangle className="h-3 w-3 mr-1 text-red-500" />
                              Failed
                            </span>
                          ) : (
                            <span className="flex items-center">
                              <Loader className="h-3 w-3 mr-1 text-yellow-500 animate-spin" />
                              Pending
                            </span>
                          )}
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
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalImages)} of {totalImages} images
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show pages around the current page
                  let pageToShow;
                  if (totalPages <= 5) {
                    pageToShow = i + 1;
                  } else if (page <= 3) {
                    pageToShow = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageToShow = totalPages - 4 + i;
                  } else {
                    pageToShow = page - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={i}
                      variant={pageToShow === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(pageToShow)}
                    >
                      {pageToShow}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}