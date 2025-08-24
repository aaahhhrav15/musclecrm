import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Accountability, AccountabilityService } from '@/services/AccountabilityService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Search, Filter, Calendar, User, Image as ImageIcon, RefreshCw, X } from 'lucide-react';
import { format } from 'date-fns';
import { Modal } from '@/components/ui/modal';

const AccountabilitiesPage: React.FC = () => {
  const { toast } = useToast();
  const [search, setSearch] = React.useState('');
  const [sortBy, setSortBy] = React.useState<'createdAt' | 'description'>('createdAt');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [view, setView] = React.useState<'grid' | 'list'>('grid');
  const [selectedAccountability, setSelectedAccountability] = React.useState<Accountability | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [startDate, setStartDate] = React.useState<string>('');
  const [endDate, setEndDate] = React.useState<string>('');
  const [showDateFilters, setShowDateFilters] = React.useState(false);

  // Fetch accountabilities
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['accountabilities', currentPage, sortBy, sortOrder, search, startDate, endDate],
    queryFn: () => AccountabilityService.list({
      page: currentPage,
      limit: 20,
      sortBy,
      sortOrder,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    })
  });



  // Filter accountabilities based on search
  const filteredAccountabilities = React.useMemo(() => {
    if (!data?.data) return [];
    
    if (!search.trim()) return data.data;
    
    return data.data.filter(accountability => 
      accountability.description.toLowerCase().includes(search.toLowerCase()) ||
      accountability.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      accountability.user?.email?.toLowerCase().includes(search.toLowerCase())
    );
  }, [data?.data, search]);

  // Handle search
  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle sort change
  const handleSortChange = (value: string) => {
    const [field, order] = value.split('-');
    setSortBy(field as 'createdAt' | 'description');
    setSortOrder(order as 'asc' | 'desc');
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle refresh
  const handleRefresh = () => {
    refetch();
    toast({
      title: 'Refreshed',
      description: 'Accountabilities data has been refreshed'
    });
  };

  // Handle modal open/close
  const handleOpenModal = (accountability: Accountability) => {
    setSelectedAccountability(accountability);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAccountability(null);
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

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Unknown date';
    }
  };

  // Render accountability card
  const renderAccountabilityCard = (accountability: Accountability) => (
    <Card 
      key={accountability._id} 
      className="group hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm cursor-pointer"
      onClick={() => handleOpenModal(accountability)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
              {accountability.user?.name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {accountability.user?.name || 'Unknown User'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {accountability.user?.email || 'No email'}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {formatDate(accountability.createdAt || '')}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Description */}
          <div>
            <p className="text-foreground leading-relaxed line-clamp-3">
              {accountability.description}
            </p>
          </div>

          {/* Image if available */}
          {accountability.imageBase64 && (
            <div className="relative group/image">
              <img
                src={accountability.imageBase64}
                alt="Accountability image"
                className="w-full h-32 object-cover rounded-lg border border-border/50 group-hover/image:border-primary/50 transition-all duration-300"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-all duration-300 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-white opacity-0 group-hover/image:opacity-100 transition-all duration-300" />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>Created {formatDate(accountability.createdAt || '')}</span>
            </div>

          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Render accountability list item
  const renderAccountabilityListItem = (accountability: Accountability) => (
    <Card 
      key={accountability._id} 
      className="group hover:shadow-md transition-all duration-300 border-border/50 cursor-pointer"
      onClick={() => handleOpenModal(accountability)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* User Avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {accountability.user?.name?.charAt(0)?.toUpperCase() || 'C'}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {accountability.user?.name || 'Unknown User'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {accountability.user?.email || 'No email'}
                </p>
              </div>
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                {formatDate(accountability.createdAt || '')}
              </Badge>
            </div>

            <p className="text-foreground leading-relaxed mb-3">
              {accountability.description}
            </p>

            {/* Image if available */}
            {accountability.imageBase64 && (
              <div className="mb-3">
                <img
                  src={accountability.imageBase64}
                  alt="Accountability image"
                  className="w-32 h-24 object-cover rounded-lg border border-border/50"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                <span>Created {formatDate(accountability.createdAt || '')}</span>
              </div>

            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-destructive text-center">
            <h2 className="text-xl font-semibold mb-2">Error Loading Accountabilities</h2>
            <p className="text-muted-foreground">
              Failed to load accountabilities. Please try again.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Error: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline">
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
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Accountabilities</h1>
            <p className="text-muted-foreground mt-2">
              Track and monitor member accountability posts and progress
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search accountabilities..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <Select value={`${sortBy}-${sortOrder}`} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt-desc">Newest First</SelectItem>
                    <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                    <SelectItem value="description-asc">Description A-Z</SelectItem>
                    <SelectItem value="description-desc">Description Z-A</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Toggle */}
                <div className="flex items-center border rounded-md">
                  <Button
                    variant={view === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setView('grid')}
                    className="rounded-r-none"
                  >
                    Grid
                  </Button>
                  <Button
                    variant={view === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setView('list')}
                    className="rounded-l-none"
                  >
                    List
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
                        ? `Showing posts from ${startDate} to ${endDate}`
                        : startDate 
                        ? `Showing posts from ${startDate} onwards`
                        : `Showing posts up to ${endDate}`
                      }
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content */}
        {isLoading ? (
          // Loading skeletons
          <div className={view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAccountabilities.length === 0 ? (
          // Empty state
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="space-y-4">
                <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No Accountabilities Found
                  </h3>
                  <p className="text-muted-foreground">
                    {search ? 'No accountabilities match your search criteria.' : 'No accountability posts have been created yet.'}
                  </p>
                </div>
                {search && (
                  <Button variant="outline" onClick={() => handleSearch('')}>
                    Clear Search
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          // Accountabilities content
          <>
            <div className={view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {filteredAccountabilities.map(accountability =>
                view === 'grid' 
                  ? renderAccountabilityCard(accountability)
                  : renderAccountabilityListItem(accountability)
              )}
            </div>

            {/* Pagination */}
            {data?.pagination && data.pagination.totalPages > 1 && (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-4">
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
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground px-3">
                        Page {currentPage} of {data.pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === data.pagination.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Modal for full view */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={selectedAccountability?.user?.name || 'Accountability Details'}
        >
          {selectedAccountability && (
            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4 pb-4 border-b">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                  {selectedAccountability.user?.name?.charAt(0)?.toUpperCase() || 'C'}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {selectedAccountability.user?.name || 'Unknown User'}
                  </h3>
                  <p className="text-muted-foreground">
                    {selectedAccountability.user?.email || 'No email'}
                  </p>
                </div>
              </div>

              {/* Full Description */}
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {selectedAccountability.description}
                </p>
              </div>

              {/* Full Image */}
              {selectedAccountability.imageBase64 && (
                <div>
                  <h4 className="font-semibold mb-2">Image</h4>
                  <div className="rounded-lg overflow-hidden border">
                    <img
                      src={selectedAccountability.imageBase64}
                      alt="Accountability image"
                      className="w-full max-h-96 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Date */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t">
                <Calendar className="w-4 h-4" />
                <span>Created {formatDate(selectedAccountability.createdAt || '')}</span>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default AccountabilitiesPage;
