import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Building, Loader2 } from 'lucide-react';
import { Toaster, toast } from '@/components/ui/sonner';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';
import { Skeleton } from '@/components/ui/skeleton';
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, { message: 'Password is required' }),
});
type LoginFormValues = z.infer<typeof loginSchema>;
export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { profile, isLoading, fetchProfile } = useCompanyProfile();
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'contractor@pillar.com',
      password: 'password123',
    },
  });
  const { isSubmitting } = form.formState;
  const onSubmit = async (values: LoginFormValues) => {
    // Mock authentication
    if (values.email === 'contractor@pillar.com' && values.password === 'password123') {
      toast.success('Login successful!');
      login();
      setTimeout(() => navigate('/'), 1000);
    } else {
      toast.error('Invalid credentials. Please use the mock data.');
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            {isLoading ? (
              <Skeleton className="h-8 w-8 rounded-full" />
            ) : profile?.logoUrl ? (
              <img src={profile.logoUrl} alt="Company Logo" className="h-8 w-8 object-contain" />
            ) : (
              <Building className="h-8 w-8 text-primary" />
            )}
            {isLoading ? (
              <Skeleton className="h-7 w-32" />
            ) : (
              <span className="text-2xl font-bold">{profile?.companyName || 'Pillar'}</span>
            )}
          </div>
          <CardTitle>Contractor Login</CardTitle>
          <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Log In
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground text-center w-full">
            This is a demo. Use the pre-filled credentials to log in.
          </p>
        </CardFooter>
      </Card>
      <Toaster richColors />
    </div>
  );
}