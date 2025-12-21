import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, ArrowRight, Calendar, Package } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { WorkshopMaterial, Tool } from '@shared/types';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { parseISO, differenceInDays, isValid, format } from 'date-fns';
interface AlertItem {
  id: string;
  name: string;
  type: 'Low Stock' | 'Date Alert';
  message: string;
  severity: 'high' | 'medium';
  location?: string;
}
export function InventoryAlerts() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [materials, tools] = await Promise.all([
            api<WorkshopMaterial[]>('/api/workshop-materials'),
            api<Tool[]>('/api/tools')
        ]);
        const newAlerts: AlertItem[] = [];
        const today = new Date();
        // Low Stock Alerts
        materials.forEach(m => {
            const threshold = m.lowStockThreshold ?? 10;
            if (m.quantity < threshold) {
                newAlerts.push({
                    id: `stock-${m.id}`,
                    name: m.name,
                    type: 'Low Stock',
                    message: `${m.quantity} ${m.unit} remaining (Threshold: ${threshold})`,
                    severity: 'high',
                    location: m.workshopName
                });
            }
        });
        // Date Alerts (Tools & Materials)
        const checkDates = (item: Tool | WorkshopMaterial, itemType: string) => {
            if (!item.properties) return;
            item.properties.forEach(prop => {
                if (prop.type === 'date' && prop.value) {
                    const date = parseISO(prop.value);
                    if (isValid(date)) {
                        const diff = differenceInDays(date, today);
                        if (diff < 0) {
                            newAlerts.push({
                                id: `date-${item.id}-${prop.name}`,
                                name: item.name,
                                type: 'Date Alert',
                                message: `${prop.name} overdue (${format(date, 'MMM d')})`,
                                severity: 'high',
                                location: 'locationName' in item ? item.locationName : ('workshopName' in item ? item.workshopName : '')
                            });
                        } else if (diff <= 7) {
                            newAlerts.push({
                                id: `date-${item.id}-${prop.name}`,
                                name: item.name,
                                type: 'Date Alert',
                                message: `${prop.name} due in ${diff} days`,
                                severity: 'medium',
                                location: 'locationName' in item ? item.locationName : ('workshopName' in item ? item.workshopName : '')
                            });
                        }
                    }
                }
            });
        };
        materials.forEach(m => checkDates(m, 'Material'));
        tools.forEach(t => checkDates(t, 'Tool'));
        // Sort by severity (high first)
        setAlerts(newAlerts.sort((a, b) => (a.severity === 'high' ? -1 : 1)));
      } catch (error) {
        console.error('Failed to fetch inventory alerts', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />;
  }
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Inventory Alerts
        </CardTitle>
        <CardDescription>Low stock and upcoming dates.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        {alerts.length > 0 ? (
          <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2">
            {alerts.map(alert => (
              <div key={alert.id} className="flex items-start justify-between p-2 border rounded-md bg-muted/30">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        {alert.type === 'Low Stock' ? <Package className="h-3 w-3 text-muted-foreground" /> : <Calendar className="h-3 w-3 text-muted-foreground" />}
                        <span className="font-medium text-sm">{alert.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{alert.message}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'} className="text-[10px] px-1.5 h-5">
                        {alert.type === 'Low Stock' ? 'Low Stock' : 'Alert'}
                    </Badge>
                    {alert.location && <span className="text-[10px] text-muted-foreground">{alert.location}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 text-green-500 mb-2" />
            <p>No inventory alerts.</p>
          </div>
        )}
      </CardContent>
      <div className="p-6 pt-0 mt-auto">
        <Button variant="outline" className="w-full" onClick={() => navigate('/resources')}>
            Manage Inventory <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}