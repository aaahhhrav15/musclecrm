import * as React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ProductService } from '@/services/ProductService';
import { Card, CardContent } from '@/components/ui/card';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Trash2 } from 'lucide-react';
import { Customer, CustomerService } from '@/services/CustomerService';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

const Section: React.FC<{ title: string; children?: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-2">
    <h3 className="text-lg font-semibold">{title}</h3>
    <div className="text-sm whitespace-pre-line text-muted-foreground">{children}</div>
  </div>
);

const ViewProductPage: React.FC = () => {
  const { id } = useParams();
  const { data, isLoading } = useQuery({ queryKey: ['product', id], queryFn: () => ProductService.get(id as string), enabled: Boolean(id) });
  const product = data?.data as any;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [formState, setFormState] = React.useState<any>({});
  const [editPriceInput, setEditPriceInput] = React.useState<string>('');

  const { data: customersData } = useQuery({ 
    queryKey: ['customers'], 
    queryFn: () => CustomerService.getCustomers({ limit: 1000 }) 
  });

  React.useEffect(() => {
    if (product) {
      setFormState(product);
      setEditPriceInput(String(product.price ?? ''));
    }
  }, [product]);

  const updateMutation = useMutation({ mutationFn: ({ id, payload }: { id: string; payload: any }) => ProductService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsEditOpen(false);
    }
  });

  const deleteMutation = useMutation({ mutationFn: (pid: string) => ProductService.remove(pid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      window.history.back();
    }
  });

  const toDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const dataUrl = await toDataUrl(file);
        setFormState((p: any) => ({ ...p, imageBase64: dataUrl }));
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to process image' });
      }
    }
  };

  if (isLoading) return (
    <DashboardLayout>
      <div className="p-6">Loading...</div>
    </DashboardLayout>
  );
  if (!product) return (
    <DashboardLayout>
      <div className="p-6">Product not found</div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-4 border-b">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">{product.name}</h1>
            <p className="text-muted-foreground text-lg">SKU: {product.sku}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xl font-semibold">₹ {product.price.toFixed(2)}</div>
            <Button variant="outline" onClick={() => setIsEditOpen(true)}>
              <Edit className="w-4 h-4 mr-2" /> Edit
            </Button>
            <Button variant="destructive" onClick={() => {
              if (confirm('Delete this product?')) deleteMutation.mutate(product._id);
            }}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/2">
          {product.imageBase64 && (
            <img src={product.imageBase64} alt={product.name} className="w-full rounded shadow" />
          )}
        </div>
        <div className="md:w-1/2 space-y-4">
          <Section title="Product Overview">{product.overview}</Section>
        </div>
        </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {product.keyBenefits && product.keyBenefits.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold">Key Benefits</h3>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                {product.keyBenefits.map((b, i) => (
                  <li key={i} className="text-sm text-muted-foreground">{b}</li>
                ))}
              </ul>
            </div>
          )}

          {product.fastFacts && <Section title="Fast Facts">{product.fastFacts}</Section>}
          {product.usage && <Section title="Usage">{product.usage}</Section>}
          {product.marketedBy && <Section title="Marketed by">{product.marketedBy}</Section>}
          {product.manufacturedBy && <Section title="Manufactured by">{product.manufacturedBy}</Section>}
          {product.disclaimer && <Section title="Disclaimer">{product.disclaimer}</Section>}
          {product.storage && <Section title="Storage">{product.storage}</Section>}
          {product.shelfLife && <Section title="Shelf life">{product.shelfLife}</Section>}
        </CardContent>
      </Card>
      </div>
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[700px] overflow-y-auto max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!id) return;
            const { _id, ...rest } = formState;
            const parsedPrice = editPriceInput.trim() === '' ? NaN : parseFloat(editPriceInput);
            if (!Number.isFinite(parsedPrice) || !formState.name || !formState.sku || !formState.url) {
              toast({ title: 'Please fill required fields' });
              return;
            }
            updateMutation.mutate({ id, payload: { ...rest, price: parsedPrice } });
          }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Product Name</label>
                <Input value={formState.name || ''} onChange={e => setFormState((p: any) => ({ ...p, name: e.target.value }))} required />
              </div>
              <div>
                <label className="text-sm">SKU</label>
                <Input value={formState.sku || ''} onChange={e => setFormState((p: any) => ({ ...p, sku: e.target.value }))} required />
              </div>
              <div>
                <label className="text-sm">Product URL</label>
                <Input 
                  type="url" 
                  value={formState.url || ''} 
                  onChange={e => setFormState((p: any) => ({ ...p, url: e.target.value }))} 
                  placeholder="https://example.com/product"
                  required 
                />
              </div>
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
            <div>
              <label className="text-sm">Customer (Optional)</label>
              <Select value={formState.customerId || 'none'} onValueChange={(value) => setFormState((p: any) => ({ ...p, customerId: value === 'none' ? undefined : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No customer assigned</SelectItem>
                  {customersData?.customers?.map((customer: Customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone || 'No phone'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm">Product Overview</label>
              <Textarea value={formState.overview || ''} onChange={e => setFormState((p: any) => ({ ...p, overview: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm">Key Benefits (one per line)</label>
              <Textarea value={(formState.keyBenefits || []).join('\n')} onChange={e => setFormState((p: any) => ({ ...p, keyBenefits: e.target.value.split('\n').filter(Boolean) }))} />
            </div>
            <div>
              <label className="text-sm">Fast Facts</label>
              <Textarea value={formState.fastFacts || ''} onChange={e => setFormState((p: any) => ({ ...p, fastFacts: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm">Usage</label>
              <Textarea value={formState.usage || ''} onChange={e => setFormState((p: any) => ({ ...p, usage: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Marketed By</label>
                <Textarea value={formState.marketedBy || ''} onChange={e => setFormState((p: any) => ({ ...p, marketedBy: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm">Manufactured By</label>
                <Textarea value={formState.manufacturedBy || ''} onChange={e => setFormState((p: any) => ({ ...p, manufacturedBy: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-sm">Disclaimer</label>
              <Textarea value={formState.disclaimer || ''} onChange={e => setFormState((p: any) => ({ ...p, disclaimer: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Storage</label>
                <Textarea value={formState.storage || ''} onChange={e => setFormState((p: any) => ({ ...p, storage: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm">Shelf Life</label>
                <Input value={formState.shelfLife || ''} onChange={e => setFormState((p: any) => ({ ...p, shelfLife: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={Boolean((updateMutation as { isPending?: boolean }).isPending)}>Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ViewProductPage;


