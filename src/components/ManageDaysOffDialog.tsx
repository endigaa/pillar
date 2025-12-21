import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, PlusCircle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { api } from '@/lib/api-client';
import type { Personnel, DayOff } from '@shared/types';
import { toast } from 'sonner';
const dayOffSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  reason: z.enum(['Vacation', 'Sick Leave', 'Personal']),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});
type DayOffFormValues = z.infer<typeof dayOffSchema>;
interface ManageDaysOffDialogProps {
  personnel: Personnel;
  onUpdate: () => void;
}
export function ManageDaysOffDialog({ personnel, onUpdate }: ManageDaysOffDialogProps) {
  const [daysOff, setDaysOff] = useState<DayOff[]>(personnel.daysOff || []);
  const form = useForm<DayOffFormValues>({
    resolver: zodResolver(dayOffSchema),
    defaultValues: {
      startDate: new Date(),
      endDate: new Date(),
      reason: 'Vacation',
    },
  });
  const { isSubmitting } = form.formState;
  const handleAddDayOff = async (values: DayOffFormValues) => {
    try {
      const newDayOff = await api<DayOff>(`/api/personnel/${personnel.id}/days-off`, {
        method: 'POST',
        body: JSON.stringify({
          ...values,
          startDate: values.startDate.toISOString(),
          endDate: values.endDate.toISOString(),
        }),
      });
      setDaysOff(prev => [...prev, newDayOff]);
      toast.success('Time off added successfully!');
      form.reset();
      onUpdate(); // Notify parent to refetch all personnel data
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add time off.');
    }
  };
  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Manage Days Off for {personnel.name}</DialogTitle>
        <DialogDescription>View and record vacation, sick leave, or personal days.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
        <div>
          <h3 className="font-semibold mb-4">Add New Time Off</h3>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddDayOff)} className="space-y-4">
              <FormField control={form.control} name="startDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Start Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="endDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>End Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="reason" render={({ field }) => (<FormItem><FormLabel>Reason</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Vacation">Vacation</SelectItem><SelectItem value="Sick Leave">Sick Leave</SelectItem><SelectItem value="Personal">Personal</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Add Record
              </Button>
            </form>
          </Form>
        </div>
        <div>
          <h3 className="font-semibold mb-4">Recorded Days Off</h3>
          <div className="border rounded-md max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {daysOff.length > 0 ? (
                  daysOff.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map(dayOff => (
                    <TableRow key={dayOff.id}>
                      <TableCell>{format(new Date(dayOff.startDate), 'PPP')}</TableCell>
                      <TableCell>{format(new Date(dayOff.endDate), 'PPP')}</TableCell>
                      <TableCell>{dayOff.reason}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">No days off recorded.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}