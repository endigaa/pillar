import { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useCompanyProfile } from "@/hooks/useCompanyProfile";
import { useCurrency } from "@/hooks/useCurrency";
import type { ChangeOrder } from "@shared/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { format } from "date-fns";
interface ChangeOrderDetailDialogProps {
  changeOrder: ChangeOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export function ChangeOrderDetailDialog({ changeOrder, open, onOpenChange }: ChangeOrderDetailDialogProps) {
  const { profile } = useCompanyProfile();
  const { formatCurrency } = useCurrency();
  const contentRef = useRef<HTMLDivElement>(null);
  if (!changeOrder) return null;
  const handlePrint = () => {
    window.print();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto sm:p-10">
        <style>
          {`
            @media print {
              body {
                visibility: hidden;
              }
              #printable-change-order, #printable-change-order * {
                visibility: visible;
              }
              #printable-change-order {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 20px;
                background: white;
                color: black;
              }
              /* Hide dialog overlay and other UI elements */
              [role="dialog"] > button {
                display: none;
              }
              .no-print {
                display: none !important;
              }
            }
          `}
        </style>
        <div id="printable-change-order" ref={contentRef} className="space-y-8 text-foreground">
          {/* Header */}
          <div className="flex justify-between items-start border-b pb-6">
            <div className="space-y-1">
              {profile?.logoUrl && (
                <img src={profile.logoUrl} alt={profile.companyName} className="h-12 object-contain mb-2" />
              )}
              <h2 className="text-2xl font-bold">{profile?.companyName || 'Contractor Name'}</h2>
              <div className="text-sm text-muted-foreground space-y-0.5">
                {profile?.address && <p className="whitespace-pre-line">{profile.address}</p>}
                {profile?.email && <p>{profile.email}</p>}
                {profile?.phone && <p>{profile.phone}</p>}
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold text-primary mb-2">CHANGE ORDER</h1>
              <div className="text-sm space-y-1">
                <p><span className="font-semibold">Date:</span> {format(new Date(changeOrder.date), 'PPP')}</p>
                <p><span className="font-semibold">Status:</span> {changeOrder.status}</p>
                <p><span className="font-semibold">ID:</span> {changeOrder.id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>
          </div>
          {/* Title & Description */}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">{changeOrder.title}</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{changeOrder.description}</p>
          </div>
          {/* Line Items */}
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold text-foreground">Description</TableHead>
                  <TableHead className="text-right font-bold text-foreground">Quantity</TableHead>
                  <TableHead className="text-right font-bold text-foreground">Unit Price</TableHead>
                  <TableHead className="text-right font-bold text-foreground">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {changeOrder.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter className="bg-muted/50">
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-bold text-lg">Grand Total</TableCell>
                  <TableCell className="text-right font-bold text-lg">{formatCurrency(changeOrder.totalAmount)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
          {/* Signatures */}
          <div className="grid grid-cols-2 gap-12 pt-12 mt-12 page-break-inside-avoid">
            <div className="space-y-8">
              <div className="border-b border-black/50 h-8"></div>
              <div className="space-y-1">
                <p className="font-semibold">Contractor Signature</p>
                <p className="text-xs text-muted-foreground">Authorized Representative</p>
                <p className="text-xs text-muted-foreground pt-2">Date: _________________</p>
              </div>
            </div>
            <div className="space-y-8">
              <div className="border-b border-black/50 h-8"></div>
              <div className="space-y-1">
                <p className="font-semibold">Client Signature</p>
                <p className="text-xs text-muted-foreground">Acceptance of Change Order</p>
                <p className="text-xs text-muted-foreground pt-2">Date: _________________</p>
              </div>
            </div>
          </div>
          {/* Footer Disclaimer */}
          <div className="text-center text-xs text-muted-foreground pt-8 border-t mt-8">
            <p>This Change Order becomes part of and is in conformance with the existing contract.</p>
          </div>
        </div>
        <DialogFooter className="no-print sm:justify-between gap-2">
           <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
           <Button onClick={handlePrint}>
             <Printer className="mr-2 h-4 w-4" />
             Print Change Order
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}