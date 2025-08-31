import * as React from 'react';
import { format, addMonths, isValid } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Customer, PersonalTrainingAssignment, CustomerTransaction } from '@/services/CustomerService';
import { RenewMembershipModal } from './RenewMembershipModal';
import { TransactionHistory } from './TransactionHistory';
import { Receipt, User, CreditCard, Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ViewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  transactions?: CustomerTransaction[];
}

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

interface MembershipStatus {
  status: string;
  variant: BadgeVariant;
}

type TrainerIdObj = { name?: string; email?: string; phone?: string };

type Trainer = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  specialization?: string;
  experience?: number;
  status?: string;
  bio?: string;
  clients?: number;
  gymId?: string;
};

interface TrainerApiResponse {
  data?: Trainer[];
  trainers?: Trainer[];
}

const formatDate = (date: string | Date | undefined) => {
  if (!date) return 'Not set';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return isValid(dateObj) ? format(dateObj, 'PPP') : 'Invalid date';
};

const formatBirthday = (date?: string | Date) => {
  if (!date) return 'Not provided';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return isValid(dateObj) ? format(dateObj, 'PPP') : 'Invalid date';
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

const getMembershipTypeColor = (type: string) => {
  switch (type) {
    case 'basic':
      return 'bg-blue-500';
    case 'premium':
      return 'bg-purple-500';
    case 'vip':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
};

const getMembershipStatus = (endDate: Date | null): MembershipStatus => {
  if (!endDate) return { status: 'No Membership', variant: 'secondary' };
  
  const today = new Date();
  const diffTime = endDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: 'Membership Expired', variant: 'destructive' };
  } else if (diffDays === 0) {
    return { status: 'Expiring Today', variant: 'destructive' };
  } else if (diffDays <= 10) {
    return { status: `Expiring in ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`, variant: 'secondary' };
  } else {
    return { status: 'Active', variant: 'default' };
  }
};

const calculateEndDate = (startDate: string | Date | undefined, duration: number) => {
  if (!startDate || !duration) return null;
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  return isValid(start) ? addMonths(start, duration) : null;
};

const formatPaymentMode = (mode: string | undefined) => {
  if (!mode) return 'Not set';
  return mode.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const formatDuration = (months: number, days: number) => {
  let result = '';
  if (months > 0) result += `${months} month${months > 1 ? 's' : ''}`;
  if (days > 0) result += (result ? ' ' : '') + `${days} day${days > 1 ? 's' : ''}`;
  return result || '0 days';
};

function isPersonalTrainingAssignmentLike(obj: unknown): obj is Partial<PersonalTrainingAssignment> {
  return !!obj && typeof obj === 'object' && 'trainerId' in (obj as Partial<PersonalTrainingAssignment>) && 'endDate' in (obj as Partial<PersonalTrainingAssignment>);
}

export const ViewCustomerModal: React.FC<ViewCustomerModalProps> = ({
  isOpen,
  onClose,
  customer,
  transactions = [],
}) => {
  const [isRenewModalOpen, setIsRenewModalOpen] = React.useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(isOpen);
  const [membershipEndDate, setMembershipEndDate] = React.useState<Date | null>(null);
  const [trainers, setTrainers] = React.useState<Trainer[]>([]);
  const [personalTrainingAssignments, setPersonalTrainingAssignments] = React.useState<PersonalTrainingAssignment[]>([]);
  const [fetchedCustomer, setFetchedCustomer] = React.useState<Customer | null>(null);

  React.useEffect(() => {
    setIsDialogOpen(isOpen);
  }, [isOpen]);

  React.useEffect(() => {
    const c = fetchedCustomer ?? customer;
    const endDate = c.membershipEndDate 
      ? new Date(c.membershipEndDate)
      : calculateEndDate(c.membershipStartDate, c.membershipDuration);
    setMembershipEndDate(endDate);
  }, [customer, fetchedCustomer]);

  React.useEffect(() => {
    if (isOpen) {
      import('@/services/ApiService').then(({ ApiService }) => {
        ApiService.get<TrainerApiResponse>('/trainers').then((res) => {
          setTrainers(res.data || res.trainers || []);
        }).catch(() => setTrainers([]));
      });
      import('@/services/CustomerService').then(({ CustomerService }) => {
        CustomerService.getCustomerById(customer.id).then((res) => {
          setPersonalTrainingAssignments(res.personalTrainingAssignments || []);
          setFetchedCustomer(res.customer);
        }).catch(() => {
          setPersonalTrainingAssignments([]);
          setFetchedCustomer(null);
        });
      });
    }
  }, [isOpen, customer.id]);

  const handleClose = () => {
    setIsDialogOpen(false);
    onClose();
  };

  const isMembershipExpired = membershipEndDate ? membershipEndDate < new Date() : false;

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="membership" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Membership
              </TabsTrigger>
              <TabsTrigger value="personalTraining" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Personal Training
              </TabsTrigger>
              <TabsTrigger value="additional" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Additional
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Basic Information</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsTransactionModalOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <Receipt className="h-4 w-4" />
                      View Transactions
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{customer.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{customer.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{customer.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">{customer.address || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant={getMembershipStatus(membershipEndDate).variant}>
                        {getMembershipStatus(membershipEndDate).status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Birthday</p>
                      <p className="font-medium">{formatBirthday(customer.birthday)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Height</p>
                      <p className="font-medium">{customer.height ? `${customer.height} cm` : 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Weight</p>
                      <p className="font-medium">{customer.weight ? `${customer.weight} kg` : 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Personal Trainer</p>
                      <div className="font-medium">
                        {customer.personalTrainer ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Assigned
                            </Badge>
                            {(() => {
                              // Debug log
                              // eslint-disable-next-line no-console
                              console.log('customer.personalTrainer:', customer.personalTrainer);
                              // eslint-disable-next-line no-console
                              console.log('trainers:', trainers);
                              let trainerId: string | undefined = undefined;
                              const pta = customer.personalTrainer as any;
                              if (typeof pta === 'string') {
                                trainerId = pta;
                              } else if (pta && typeof pta === 'object') {
                                if (typeof pta.trainerId === 'string') {
                                  trainerId = pta.trainerId;
                                } else if (pta.trainerId && typeof pta.trainerId === 'object' && pta.trainerId._id) {
                                  trainerId = pta.trainerId._id;
                                }
                              }
                              // eslint-disable-next-line no-console
                              console.log('Resolved trainerId:', trainerId);
                              const trainer = trainers.find(t => t._id === trainerId);
                              if (trainer) {
                                return (
                                  <span className="text-sm text-muted-foreground">
                                    ({trainer.name} | {trainer.email} | {trainer.phone})
                                  </span>
                                );
                              }
                              if (trainerId) {
                                return (
                                  <span className="text-sm text-muted-foreground">
                                    (Trainer ID: {trainerId})
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        ) : (
                          <Badge variant="secondary">Not Assigned</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="membership">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Membership Information</h3>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsRenewModalOpen(true)}
                      className={isMembershipExpired ? "text-red-500 hover:text-red-600" : ""}
                    >
                      {isMembershipExpired ? "Renew Expired Membership" : "Renew Membership"}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Membership Type</p>
                      <Badge className={`${getMembershipTypeColor((fetchedCustomer ?? customer).membershipType || 'none')} text-white`}>
                        {(fetchedCustomer ?? customer).membershipType?.toUpperCase() || 'NONE'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-medium">{formatDuration((fetchedCustomer ?? customer).membershipDuration || 0, (fetchedCustomer ?? customer).membershipDays || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fees</p>
                      <p className="font-medium">{formatCurrency((fetchedCustomer ?? customer).membershipFees)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Spent</p>
                      <p className="font-medium">{formatCurrency((fetchedCustomer ?? customer).totalSpent)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Start Date</p>
                      <p className="font-medium">{formatDate((fetchedCustomer ?? customer).membershipStartDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Expiry Date</p>
                      <p className="font-medium">
                        {formatDate(membershipEndDate)}
                        {isMembershipExpired && (
                          <Badge variant="destructive" className="ml-2">Expired</Badge>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Join Date</p>
                      <p className="font-medium">{formatDate((fetchedCustomer ?? customer).joinDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Transaction Date</p>
                      <p className="font-medium">{formatDate((fetchedCustomer ?? customer).transactionDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Mode</p>
                      <p className="font-medium capitalize">{formatPaymentMode((fetchedCustomer ?? customer).paymentMode)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Membership Status</p>
                      <Badge variant={isMembershipExpired ? "destructive" : "default"}>
                        {isMembershipExpired ? "EXPIRED" : "ACTIVE"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="personalTraining">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Personal Training Assignments</h3>
                  {/* Prepare assignments: use personalTrainingAssignments if available, else fallback to customer.personalTrainer if it's an object */}
                  {(() => {
                    const assignments = personalTrainingAssignments && personalTrainingAssignments.length > 0
                      ? personalTrainingAssignments
                      : (isPersonalTrainingAssignmentLike(customer.personalTrainer))
                        ? [{
                            ...customer.personalTrainer as Partial<PersonalTrainingAssignment>,
                            _id: customer.personalTrainer._id || 'fallback',
                            customerId: customer.id,
                            trainerId: customer.personalTrainer.trainerId,
                            gymId: customer.personalTrainer.gymId || '',
                            startDate: customer.personalTrainer.startDate,
                            duration: customer.personalTrainer.duration,
                            endDate: customer.personalTrainer.endDate,
                            fees: customer.personalTrainer.fees,
                            createdAt: customer.personalTrainer.createdAt || '',
                            updatedAt: customer.personalTrainer.updatedAt || '',
                          } as PersonalTrainingAssignment]
                        : [];
                    if (assignments.length > 0) {
                      // Find the assignment with the latest endDate
                      const latestAssignment = assignments.reduce((latest, curr) => {
                        if (!latest) return curr;
                        const latestDate = new Date((latest as PersonalTrainingAssignment).endDate || 0);
                        const currDate = new Date(curr.endDate || 0);
                        return currDate > latestDate ? curr : latest;
                      }, assignments[0] as PersonalTrainingAssignment);
                      return (
                        <>
                          <div className="mb-4">
                            <span className="font-medium">Current Personal Training End Date: </span>
                            <span>{formatDate(latestAssignment.endDate)}</span>
                          </div>
                          <div className="space-y-4">
                            {assignments.map((pta) => {
                              // Resolve trainer details like in the Basic tab
                              let trainerId: string | undefined = undefined;
                              if (typeof pta.trainerId === 'string') {
                                trainerId = pta.trainerId;
                              } else if (pta.trainerId && typeof pta.trainerId === 'object' && '_id' in pta.trainerId) {
                                trainerId = pta.trainerId._id;
                              }
                              const trainer = trainers.find(t => t._id === trainerId);
                              return (
                                <div key={pta._id} className="border rounded p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                  <div>
                                    <div className="font-medium">Trainer: {trainer?.name || (typeof pta.trainerId === 'object' && pta.trainerId && (pta.trainerId as TrainerIdObj).name ? (pta.trainerId as TrainerIdObj).name : 'N/A')}</div>
                                    <div className="text-sm text-muted-foreground">Email: {trainer?.email || (typeof pta.trainerId === 'object' && pta.trainerId && (pta.trainerId as TrainerIdObj).email ? (pta.trainerId as TrainerIdObj).email : 'N/A')}</div>
                                    <div className="text-sm text-muted-foreground">Phone: {trainer?.phone || (typeof pta.trainerId === 'object' && pta.trainerId && (pta.trainerId as TrainerIdObj).phone ? (pta.trainerId as TrainerIdObj).phone : 'N/A')}</div>
                                  </div>
                                  <div>
                                    <div>Start: {formatDate(pta.startDate)}</div>
                                    <div>End: {formatDate(pta.endDate)}</div>
                                    <div>Duration: {pta.duration} months</div>
                                  </div>
                                  <div>
                                    <div>Fees: {formatCurrency(pta.fees)}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      );
                    } else {
                      return <p className="text-muted-foreground">No personal training assignments found.</p>;
                    }
                  })()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="additional">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Source</p>
                      <p className="font-medium capitalize">{customer.source || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created At</p>
                      <p className="font-medium">{formatDate(customer.createdAt)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p className="font-medium">{customer.notes || 'No notes available'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
            {((fetchedCustomer ?? customer).membershipType !== 'none') && (
              <Button onClick={() => setIsRenewModalOpen(true)}>
                Renew Membership
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RenewMembershipModal
        isOpen={isRenewModalOpen}
        onClose={() => setIsRenewModalOpen(false)}
        customer={customer}
      />

      <Dialog open={isTransactionModalOpen} onOpenChange={setIsTransactionModalOpen}>
        <DialogContent className="max-w-full w-[98vw] sm:max-w-5xl px-2">
          <DialogHeader>
            <DialogTitle>Transaction History</DialogTitle>
          </DialogHeader>
          <TransactionHistory userId={customer.id} />
        </DialogContent>
      </Dialog>
    </>
  );
};
