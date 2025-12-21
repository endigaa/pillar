import { AppLayout } from '@/components/layout/AppLayout';
import { CompanyProfileForm } from '@/components/CompanyProfileForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoryManager } from '@/components/CategoryManager';
export function SettingsPage() {
  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your company profile and application settings.</p>
        </div>
        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">Company Profile</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Company Profile</CardTitle>
                <CardDescription>
                  This information will be displayed on quotes, invoices, and the client portal.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CompanyProfileForm />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="categories">
            <CategoryManager />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}