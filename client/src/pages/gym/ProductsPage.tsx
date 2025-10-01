import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Product, ProductService } from '@/services/ProductService';
// Customer selection removed per request
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Plus, Edit, Trash2, Download, ArrowUpDown } from 'lucide-react';
import * as Papa from 'papaparse';
import type { AxiosError } from 'axios';

const toDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const ProductsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [view, setView] = React.useState<'grid' | 'table'>('grid');
  const [search, setSearch] = React.useState('');
  const [minPrice, setMinPrice] = React.useState<string>('');
  const [maxPrice, setMaxPrice] = React.useState<string>('');
  const [sortBy, setSortBy] = React.useState<'name' | 'price' | 'createdAt'>('createdAt');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('desc');
  // Removed customer filter state
  // Infinite scroll state
  const [visibleCount, setVisibleCount] = React.useState(12);
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);
  const [priceInput, setPriceInput] = React.useState<string>('0');
  const [editPriceInput, setEditPriceInput] = React.useState<string>('');
  const [formState, setFormState] = React.useState<Partial<Product>>({
    name: '',
    sku: '',
    price: 0,
    imageUrl: '',
    overview: '',
    keyBenefits: [],
    fastFacts: '',
    usage: '',
    marketedBy: '',
    manufacturedBy: '',
    disclaimer: '',
    storage: '',
    shelfLife: ''
  });

  const { data, isLoading } = useQuery({ queryKey: ['products'], queryFn: ProductService.list });
  // Removed customers query

  const createMutation = useMutation({ mutationFn: ProductService.create as (p: Product) => Promise<{ success: boolean; data: Product }>, 
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Product created' });
      setIsOpen(false);
      setFormState({ name: '', sku: '', price: 0, imageUrl: '' });
      setPriceInput('0');
    },
    onError: (err: unknown) => {
      const message = (err as AxiosError<{ message?: string }>)?.response?.data?.message || 'Failed to create product';
      toast({ title: 'Error', description: message });
    }
  });

  const updateMutation = useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Partial<Product> }) => ProductService.update(id, payload) as Promise<{ success: boolean; data: Product }>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Product updated' });
      setIsEditOpen(false);
      setEditingProduct(null);
    },
    onError: (err: unknown) => {
      const message = (err as AxiosError<{ message?: string }>)?.response?.data?.message || 'Failed to update product';
      toast({ title: 'Error', description: message });
    }
  });

  const deleteMutation = useMutation({ mutationFn: (id: string) => ProductService.remove(id) as Promise<{ success: boolean; data: Record<string, never> }>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Product deleted' });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete product' });
    }
  });

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 800x800)
        const maxSize = 800;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8); // 80% quality
        resolve(compressedDataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast({ 
        title: 'File too large', 
        description: 'Please select an image smaller than 50MB' 
      });
      return;
    }
    
    try {
      const compressedDataUrl = await compressImage(file);
      setFormState(prev => ({ ...prev, imageUrl: compressedDataUrl }));
    } catch (error) {
      toast({ 
        title: 'Error processing image', 
        description: 'Please try a different image' 
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = priceInput.trim() === '' ? NaN : parseFloat(priceInput);
    if (!formState.name || !formState.sku || !formState.imageUrl || !Number.isFinite(parsedPrice)) {
      toast({ title: 'Please fill required fields' });
      return;
    }
    createMutation.mutate({ ...(formState as Product), price: parsedPrice } as Product);
  };

  const products = React.useMemo(() => data?.data ?? [], [data]);

  const filtered = React.useMemo(() => {
    const s = search.trim().toLowerCase();
    const min = minPrice ? parseFloat(minPrice) : undefined;
    const max = maxPrice ? parseFloat(maxPrice) : undefined;
    return products.filter(p => {
      const matchesSearch = !s || p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s);
      const matchesMin = min === undefined || p.price >= min;
      const matchesMax = max === undefined || p.price <= max;
      return matchesSearch && matchesMin && matchesMax;
    });
  }, [products, search, minPrice, maxPrice]);

  const sorted = React.useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let val = 0;
      if (sortBy === 'name') val = a.name.localeCompare(b.name);
      else if (sortBy === 'price') val = a.price - b.price;
      else val = new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime();
      return sortDir === 'asc' ? val : -val;
    });
    return arr;
  }, [filtered, sortBy, sortDir]);

  const itemsToRender = React.useMemo(() => sorted.slice(0, visibleCount), [sorted, visibleCount]);

  // Reset visible count when filters/sorting change
  React.useEffect(() => {
    setVisibleCount(12);
  }, [search, minPrice, maxPrice, sortBy, sortDir]);

  // IntersectionObserver to load more when reaching the sentinel
  React.useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setVisibleCount((c) => Math.min(c + 12, sorted.length));
      }
    }, { threshold: 1.0 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [sorted.length]);

  // Ensure form state is properly set when edit dialog opens
  React.useEffect(() => {
    if (isEditOpen && editingProduct) {
      // Handle customerId - if it's populated (object), extract the ID; if it's a string, use it; otherwise use 'none'
      let customerIdValue = 'none';
      if (editingProduct.customerId) {
        if (typeof editingProduct.customerId === 'object' && editingProduct.customerId !== null) {
          // It's a populated customer object, extract the ID
          const customer = editingProduct.customerId as { _id: string };
          customerIdValue = customer._id || 'none';
        } else if (typeof editingProduct.customerId === 'string') {
          // It's already a string ID
          customerIdValue = editingProduct.customerId;
        }
      }
      setFormState(prev => ({ ...prev, customerId: customerIdValue }));
    }
  }, [isEditOpen, editingProduct]);

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    
    // Handle customerId - if it's populated (object), extract the ID; if it's a string, use it; otherwise use 'none'
    let customerIdValue = 'none';
    if (p.customerId) {
      if (typeof p.customerId === 'object' && p.customerId !== null) {
        // It's a populated customer object, extract the ID
        const customer = p.customerId as { _id: string };
        customerIdValue = customer._id || 'none';
      } else if (typeof p.customerId === 'string') {
        // It's already a string ID
        customerIdValue = p.customerId;
      }
    }
    
    setFormState({ ...p, customerId: customerIdValue });
    setEditPriceInput(String(p.price ?? ''));
    setIsEditOpen(true);
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
    if (confirm('Delete this product?')) {
      deleteMutation.mutate(id);
    } else {
      setDeleteId(null);
    }
  };

  const handleExport = () => {
    const rows = sorted.map(p => ({
      name: p.name,
      sku: p.sku,
      price: p.price,
      imageUrl: p.imageUrl,
      overview: p.overview || '',
      keyBenefits: (p.keyBenefits || []).join('|'),
      fastFacts: p.fastFacts || '',
      usage: p.usage || '',
      marketedBy: p.marketedBy || '',
      manufacturedBy: p.manufacturedBy || '',
      disclaimer: p.disclaimer || '',
      storage: p.storage || '',
      shelfLife: p.shelfLife || ''
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `products-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV import removed per request

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-4 border-b">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Products</h1>
            <p className="text-muted-foreground text-lg">Manage and publish your products with images and details.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            {/* CSV import removed per request */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] overflow-y-auto max-h-[85vh]">
            <DialogHeader>
              <DialogTitle>Add Product</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">Product Name</label>
                  <Input value={formState.name || ''} onChange={e => setFormState(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div>
                  <label className="text-sm">SKU</label>
                  <Input value={formState.sku || ''} onChange={e => setFormState(p => ({ ...p, sku: e.target.value }))} required />
                </div>
                {/* URL removed per request */}
                <div>
                  <label className="text-sm">Price</label>
                  <Input type="number" step="0.01" value={priceInput} onChange={e => setPriceInput(e.target.value)} required />
                </div>
                <div>
                  <label className="text-sm">Image</label>
                  <Input type="file" accept="image/*" onChange={handleFileChange} required />
                  <p className="text-xs text-muted-foreground mt-1">Max size: 10MB. Images will be automatically compressed.</p>
                </div>
              </div>
              {/* Customer selection removed per request */}
              <div>
                <label className="text-sm">Product Overview</label>
                <Textarea value={formState.overview || ''} onChange={e => setFormState(p => ({ ...p, overview: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm">Key Benefits (one per line)</label>
                <Textarea value={(formState.keyBenefits || []).join('\n')} onChange={e => setFormState(p => ({ ...p, keyBenefits: e.target.value.split('\n').filter(Boolean) }))} />
              </div>
              <div>
                <label className="text-sm">Fast Facts</label>
                <Textarea value={formState.fastFacts || ''} onChange={e => setFormState(p => ({ ...p, fastFacts: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm">Usage</label>
                <Textarea value={formState.usage || ''} onChange={e => setFormState(p => ({ ...p, usage: e.target.value }))} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">Marketed By</label>
                  <Textarea value={formState.marketedBy || ''} onChange={e => setFormState(p => ({ ...p, marketedBy: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm">Manufactured By</label>
                  <Textarea value={formState.manufacturedBy || ''} onChange={e => setFormState(p => ({ ...p, manufacturedBy: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-sm">Disclaimer</label>
                <Textarea value={formState.disclaimer || ''} onChange={e => setFormState(p => ({ ...p, disclaimer: e.target.value }))} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">Storage</label>
                  <Textarea value={formState.storage || ''} onChange={e => setFormState(p => ({ ...p, storage: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm">Shelf Life</label>
                  <Input value={formState.shelfLife || ''} onChange={e => setFormState(p => ({ ...p, shelfLife: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={Boolean((createMutation as { isPending?: boolean }).isPending)}>Save</Button>
              </div>
            </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Controls */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <Input placeholder="Search by name or SKU" value={search} onChange={e => setSearch(e.target.value)} className="w-full md:w-64" />
                <Badge variant="secondary">{filtered.length} items</Badge>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <Input placeholder="Min Price" type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="w-32" />
                <Input placeholder="Max Price" type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="w-32" />
                {/* Customer filter removed per request */}
                <Select value={`${sortBy}:${sortDir}`} onValueChange={(v) => {
                  const [sb, sd] = v.split(':') as ['name' | 'price' | 'createdAt', 'asc' | 'desc'];
                  setSortBy(sb);
                  setSortDir(sd);
                }}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt:desc">Newest</SelectItem>
                    <SelectItem value="createdAt:asc">Oldest</SelectItem>
                    <SelectItem value="name:asc">Name A→Z</SelectItem>
                    <SelectItem value="name:desc">Name Z→A</SelectItem>
                    <SelectItem value="price:asc">Price Low→High</SelectItem>
                    <SelectItem value="price:desc">Price High→Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <Tabs value={view} onValueChange={(v) => setView(v as 'grid' | 'table')}>
            <div className="flex items-center justify-between mb-3">
              <TabsList>
                <TabsTrigger value="grid">Grid</TabsTrigger>
                <TabsTrigger value="table">Table</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="grid">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {itemsToRender.map((p) => (
                  <Card key={p._id} className="border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <span className="truncate max-w-[200px]">{p.name}</span>
                        <Badge variant="secondary" className="ml-2">{p.sku}</Badge>
                      </CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/dashboard/gym/products/${p._id}`)}>View</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(p)}>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => confirmDelete(p._id!)}>
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardHeader>
                    <CardContent className="cursor-pointer" onClick={() => navigate(`/dashboard/gym/products/${p._id}`)}>
                              {p.imageUrl && (
          <img src={p.imageUrl} alt={p.name} className="w-full h-40 object-cover rounded" />
        )}
                      <div className="mt-3 font-semibold">₹ {p.price.toFixed(2)}</div>
                      {/* Customer visibility text removed; products visible to all */}
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div ref={loadMoreRef} className="h-8" />
            </TabsContent>

            <TabsContent value="table">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>
                            <button className="inline-flex items-center gap-1" onClick={() => setSortBy('price')}>
                              Price <ArrowUpDown className="w-4 h-4" />
                            </button>
                          </TableHead>
                          {/* Customer column removed */}
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {itemsToRender.map(p => (
                          <TableRow key={p._id} className="hover:bg-muted/30">
                            <TableCell className="font-medium cursor-pointer" onClick={() => navigate(`/dashboard/gym/products/${p._id}`)}>{p.name}</TableCell>
                            <TableCell>{p.sku}</TableCell>
                            <TableCell>₹ {p.price.toFixed(2)}</TableCell>
                            {/* Customer column removed */}
                            <TableCell className="space-x-2">
                              <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/gym/products/${p._id}`)}>View</Button>
                              <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                                <Edit className="w-4 h-4 mr-1" /> Edit
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => confirmDelete(p._id!)}>
                                <Trash2 className="w-4 h-4 mr-1" /> Delete
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
              <div ref={loadMoreRef} className="h-8" />
            </TabsContent>
          </Tabs>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[700px] overflow-y-auto max-h-[85vh]">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!editingProduct?._id) return;
              const { _id, ...rest } = formState as Product;
              const parsedPrice = editPriceInput.trim() === '' ? NaN : parseFloat(editPriceInput);
              if (!Number.isFinite(parsedPrice) || !formState.name || !formState.sku) {
                toast({ title: 'Please fill required fields' });
                return;
              }
              updateMutation.mutate({ id: editingProduct._id, payload: { ...rest, price: parsedPrice } });
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">Product Name</label>
                  <Input value={formState.name || ''} onChange={e => setFormState(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div>
                  <label className="text-sm">SKU</label>
                  <Input value={formState.sku || ''} onChange={e => setFormState(p => ({ ...p, sku: e.target.value }))} required />
                </div>
                {/* URL removed per request */}
                <div>
                  <label className="text-sm">Price</label>
                  <Input type="number" step="0.01" value={editPriceInput} onChange={e => setEditPriceInput(e.target.value)} required />
                </div>
                <div>
                  <label className="text-sm">Image</label>
                  <Input type="file" accept="image/*" onChange={handleFileChange} />
                  <p className="text-xs text-muted-foreground mt-1">Max size: 10MB. Images will be automatically compressed.</p>
                </div>
              </div>
              {/* Customer selection removed per request */}
              <div>
                <label className="text-sm">Product Overview</label>
                <Textarea value={formState.overview || ''} onChange={e => setFormState(p => ({ ...p, overview: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm">Key Benefits (one per line)</label>
                <Textarea value={(formState.keyBenefits || []).join('\n')} onChange={e => setFormState(p => ({ ...p, keyBenefits: e.target.value.split('\n').filter(Boolean) }))} />
              </div>
              <div>
                <label className="text-sm">Fast Facts</label>
                <Textarea value={formState.fastFacts || ''} onChange={e => setFormState(p => ({ ...p, fastFacts: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm">Usage</label>
                <Textarea value={formState.usage || ''} onChange={e => setFormState(p => ({ ...p, usage: e.target.value }))} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">Marketed By</label>
                  <Textarea value={formState.marketedBy || ''} onChange={e => setFormState(p => ({ ...p, marketedBy: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm">Manufactured By</label>
                  <Textarea value={formState.manufacturedBy || ''} onChange={e => setFormState(p => ({ ...p, manufacturedBy: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-sm">Disclaimer</label>
                <Textarea value={formState.disclaimer || ''} onChange={e => setFormState(p => ({ ...p, disclaimer: e.target.value }))} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">Storage</label>
                  <Textarea value={formState.storage || ''} onChange={e => setFormState(p => ({ ...p, storage: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm">Shelf Life</label>
                  <Input value={formState.shelfLife || ''} onChange={e => setFormState(p => ({ ...p, shelfLife: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={Boolean((updateMutation as { isPending?: boolean }).isPending)}>Save Changes</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ProductsPage;


