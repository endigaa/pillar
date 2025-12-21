import { AppLayout } from '@/components/layout/AppLayout';
import { SupplierList } from '@/components/SupplierList';
export function SupplierManagementPage() {
  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Supplier Management</h1>
          <p className="text-muted-foreground">Manage your suppliers and their material price lists.</p>
        </div>
        <SupplierList />
      </div>
    </AppLayout>
  );
}