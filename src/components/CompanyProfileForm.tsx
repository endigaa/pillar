import { useEffect, useState, ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Upload } from 'lucide-react';
import { Toaster, toast } from '@/components/ui/sonner';
import { api } from '@/lib/api-client';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CURRENCIES } from '@/hooks/useCurrency';
const profileFormSchema = z.object({
  companyName: z.string().min(2, { message: 'Company name is required.' }),
  email: z.string().email({ message: 'A valid email is required.' }),
  phone: z.string().min(10, { message: 'A valid phone number is required.' }),
  address: z.string().min(10, { message: 'A valid address is required.' }),
  logoUrl: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  financialYearStartMonth: z.number().min(1).max(12),
  financialYearStartDay: z.number().min(1).max(31),
  currency: z.string().optional(),
});
type ProfileFormValues = z.infer<typeof profileFormSchema>;
const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];
export function CompanyProfileForm() {
  const { profile, isLoading, fetchProfile, updateProfile } = useCompanyProfile();
  const [isUploading, setIsUploading] = useState(false);
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      companyName: '',
      email: '',
      phone: '',
      address: '',
      logoUrl: '',
      financialYearStartMonth: 1,
      financialYearStartDay: 1,
      currency: 'USD',
    },
  });
  useEffect(() => {
    if (!profile) {
      fetchProfile();
    } else {
      form.reset({
        companyName: profile.companyName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        logoUrl: profile.logoUrl || '',
        financialYearStartMonth: profile.financialYearStartMonth || 1,
        financialYearStartDay: profile.financialYearStartDay || 1,
        currency: profile.currency || 'USD',
      });
    }
  }, [profile, fetchProfile, form]);
  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      // This is a mock upload. In a real app, you'd upload the file to a storage service.
      const { url } = await api<{ url: string }>('/api/upload-logo', { method: 'POST' });
      form.setValue('logoUrl', url, { shouldValidate: true });
      toast.success('Logo uploaded successfully!');
    } catch (error) {
      toast.error('Logo upload failed.');
    } finally {
      setIsUploading(false);
    }
  };
  const { isSubmitting } = form.formState;
  const onSubmit = async (values: ProfileFormValues) => {
    try {
      await updateProfile({
        ...values,
        logoUrl: values.logoUrl || '',
        currency: values.currency || 'USD',
      });
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile.');
    }
  };
  if (isLoading && !profile) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-24 self-end" />
      </div>
    );
  }
  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your Company LLC" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="contact@yourcompany.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="555-123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Textarea placeholder="123 Main St, Anytown, USA 12345" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="financialYearStartMonth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Financial Year Start Month</FormLabel>
                  <Select
                    onValueChange={(val) => field.onChange(Number(val))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MONTHS.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>The month your financial year begins.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="financialYearStartDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Financial Year Start Day</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      {...field}
                      onChange={e => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>The day of the month your financial year begins.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  The currency used for all financial values.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="logoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Logo</FormLabel>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={field.value || undefined} />
                    <AvatarFallback>{profile?.companyName?.charAt(0) || 'P'}</AvatarFallback>
                  </Avatar>
                  <Button asChild variant="outline">
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                      Upload Logo
                    </label>
                  </Button>
                  <Input id="logo-upload" type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
                </div>
                <FormControl>
                  <Input type="hidden" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {(isSubmitting || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
      <Toaster richColors />
    </>
  );
}