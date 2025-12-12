import { z } from 'zod';

export const customerFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  gender: z.string().min(1, 'Please select a gender').refine(
    (val) => ['male', 'female', 'other'].includes(val),
    { message: 'Please select a valid gender option' }
  ),
  source: z.enum(['website', 'referral', 'walk-in', 'social_media', 'other']),
  membershipType: z.enum(['none', 'basic', 'premium', 'vip']),
  membershipFees: z.number().min(0, 'Membership fees must be a positive number'),
  membershipDuration: z.number().min(0, 'Membership duration must be a positive number'),
  joinDate: z.date(),
  membershipStartDate: z.date(),
  membershipEndDate: z.date().optional(),
  transactionDate: z.date(),
  paymentMode: z.enum(['cash', 'card', 'upi', 'bank_transfer', 'other']),
  notes: z.string().optional(),
  birthday: z.date().optional(),
  height: z.number().min(0).max(300).optional(), // Height in cm
  weight: z.number().min(0).max(500).optional(), // Weight in kg
});

export type CustomerFormData = z.infer<typeof customerFormSchema>; 