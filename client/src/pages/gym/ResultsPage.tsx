import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Search, 
  Grid3X3, 
  List, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  Calendar,
  User,
  Weight,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { ResultService, Result } from '@/services/ResultService';
import { useToast } from '@/hooks/use-toast';
import { Modal } from '@/components/ui/modal';
import { S3_BUCKET_URL } from '@/config';

const ResultsPage: React.FC = () => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [sortBy, setSortBy] = React.useState('createdAt');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [search, setSearch] = React.useState('');
  const [selectedResult, setSelectedResult] = React.useState<Result | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [startDate, setStartDate] = React.useState<string>('');
  const [endDate, setEndDate] = React.useState<string>('');
  const [showDateFilters, setShowDateFilters] = React.useState(false);
  const { toast } = useToast();

  // Fetch results
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['results', currentPage, sortBy, sortOrder, search, startDate, endDate],
    queryFn: () => ResultService.list({
      page: currentPage,
      limit: 20,
      sortBy,
      sortOrder,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    })
  });

  // Filter results based on search
  const filteredResults = React.useMemo(() => {
    if (!data?.data) return [];
    
    if (!search.trim()) return data.data;
    
    return data.data.filter(result => 
      result.description.toLowerCase().includes(search.toLowerCase()) ||
      result.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      result.user?.email?.toLowerCase().includes(search.toLowerCase())
    );
  }, [data?.data, search]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: 'Refreshed',
      description: 'Results data has been refreshed'
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle modal open/close
  const handleOpenModal = (result: Result) => {
    setSelectedResult(result);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedResult(null);
  };

  // Handle date filter changes
  const handleDateFilterChange = () => {
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleClearDateFilters = () => {
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold mb-2">Error Loading Results</h2>
            <p className="text-muted-foreground">
              Failed to load results. Please try again.
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Results</h1>
            <p className="text-muted-foreground">
              Track and view member results and progress
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search results..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Date</SelectItem>
                <SelectItem value="description">Description</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Desc</SelectItem>
                <SelectItem value="asc">Asc</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Date Filters */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold">Date Range Filter</h3>
                {(startDate || endDate) && (
                  <Badge variant="secondary" className="ml-2">
                    Active
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {(startDate || endDate) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearDateFilters}
                    className="text-xs"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDateFilters(!showDateFilters)}
                  className="text-xs"
                >
                  {showDateFilters ? 'Hide' : 'Show'} Filters
                </Button>
              </div>
            </div>
            
            {showDateFilters && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">From Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        handleDateFilterChange();
                      }}
                      className="w-full"
                      placeholder="Select start date"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">To Date</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        handleDateFilterChange();
                      }}
                      className="w-full"
                      placeholder="Select end date"
                    />
                  </div>
                </div>
                
                {(startDate || endDate) && (
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {startDate && endDate 
                        ? `Showing results from ${startDate} to ${endDate}`
                        : startDate 
                        ? `Showing results from ${startDate} onwards`
                        : `Showing results up to ${endDate}`
                      }
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">No Results Found</h3>
              <p className="text-muted-foreground">
                {search ? 'No results match your search criteria.' : 'No result posts have been created yet.'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Results content */}
                         <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
               {filteredResults.map(result =>
                 <Card 
                   key={result._id} 
                   className="group hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
                   onClick={() => handleOpenModal(result)}
                 >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                          {result.user?.name?.charAt(0)?.toUpperCase() || 'C'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {result.user?.name || 'Unknown User'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {result.user?.email || 'No email'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                                     <CardContent className="space-y-4">
                     <div>
                       <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                         {result.description}
                       </p>
                     </div>
                    
                    {result.weight && (
                      <div className="flex items-center gap-2">
                        <Weight className="w-4 h-4 text-muted-foreground" />
                        <Badge variant="secondary">
                          {result.weight} kg
                        </Badge>
                      </div>
                    )}
                    
                    {result.s3Key && (
                      <div className="h-32 rounded-lg overflow-hidden bg-muted">
                        <img
                          src={`${S3_BUCKET_URL}/${result.s3Key}`}
                          alt="Result"
                          className="w-full h-full object-cover"
                          onLoad={() => {
                            console.log('Result image URL:', `${S3_BUCKET_URL}/${result.s3Key}`);
                          }}
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Created {formatDate(result.createdAt || '')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Pagination */}
            {data?.pagination && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {((data.pagination.currentPage - 1) * data.pagination.itemsPerPage) + 1} to{' '}
                  {Math.min(data.pagination.currentPage * data.pagination.itemsPerPage, data.pagination.totalItems)} of{' '}
                  {data.pagination.totalItems} results
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        variant={page === currentPage ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === data.pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
                 )}

         {/* Modal for full view */}
         <Modal
           isOpen={isModalOpen}
           onClose={handleCloseModal}
           title={selectedResult?.user?.name || 'Result Details'}
         >
           {selectedResult && (
             <div className="p-6 space-y-6">
               {/* User Info */}
               <div className="flex items-center gap-4 pb-4 border-b">
                 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                   {selectedResult.user?.name?.charAt(0)?.toUpperCase() || 'C'}
                 </div>
                 <div>
                   <h3 className="font-semibold text-lg">
                     {selectedResult.user?.name || 'Unknown User'}
                   </h3>
                   <p className="text-muted-foreground">
                     {selectedResult.user?.email || 'No email'}
                   </p>
                 </div>
               </div>

               {/* Full Description */}
               <div>
                 <h4 className="font-semibold mb-2">Description</h4>
                 <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                   {selectedResult.description}
                 </p>
               </div>

               {/* Weight */}
               {selectedResult.weight && (
                 <div>
                   <h4 className="font-semibold mb-2">Weight</h4>
                   <Badge variant="secondary" className="text-base px-3 py-1">
                     {selectedResult.weight} kg
                   </Badge>
                 </div>
               )}

               {/* Full Image */}
               {selectedResult.s3Key && (
                 <div>
                   <h4 className="font-semibold mb-2">Image</h4>
                   <div className="rounded-lg overflow-hidden border">
                     <img
                       src={`${S3_BUCKET_URL}/${selectedResult.s3Key}`}
                       alt="Result"
                       className="w-full max-h-96 object-contain"
                       onError={(e) => {
                         const target = e.target as HTMLImageElement;
                         target.style.display = 'none';
                       }}
                       onLoad={() => {
                         console.log('Result image URL:', `${S3_BUCKET_URL}/${selectedResult.s3Key}`);
                       }}
                     />
                   </div>
                 </div>
               )}

               {/* Date */}
               <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t">
                 <Calendar className="w-4 h-4" />
                 <span>Created {formatDate(selectedResult.createdAt || '')}</span>
               </div>
             </div>
           )}
         </Modal>
       </div>
     </DashboardLayout>
   );
 };

export default ResultsPage;
