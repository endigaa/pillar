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
import type { Project, Expense, WorksiteMaterialIssue } from "@shared/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { format } from "date-fns";
import { calculateProjectFinancials, calculateTotalExpense } from "@/lib/utils";
interface ProjectCostReportDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export function ProjectCostReportDialog({ project, open, onOpenChange }: ProjectCostReportDialogProps) {
  const { profile } = useCompanyProfile();
  const { formatCurrency } = useCurrency();
  const contentRef = useRef<HTMLDivElement>(null);
  if (!project) return null;
  const handlePrint = () => {
    window.print();
  };
  // Calculate Financials
  const { totalCost, totalExpenses, totalMaterials, contractorFee, baseCost } = calculateProjectFinancials(project);
  // Group by Work Stage (Expenses only)
  const expensesByStage = (project.expenses || []).reduce((acc, expense) => {
    const stage = expense.workStage || 'Unassigned';
    const amount = calculateTotalExpense(expense);
    acc[stage] = (acc[stage] || 0) + amount;
    return acc;
  }, {} as Record<string, number>);
  const sortedStages = Object.entries(expensesByStage).sort((a, b) => b.1 - a.1);
  // Group by Area (Expenses + Materials)
  const costsByArea = (project.expenses || []).reduce((acc, expense) => {
    const area = expense.areaName || 'General Project';
    const amount = calculateTotalExpense(expense);
    acc[area] = (acc[area] || 0) + amount;
    return acc;
  }, {} as Record<string, number>);
  (project.worksiteMaterials || []).reduce((acc, material) => {
    const area = material.areaName || 'General Project';
    const amount = (material.quantity * (material.unitCost || 0));
    acc[area] = (acc[area] || 0) + amount;
    return acc;
  }, costsByArea);
  const sortedAreas = Object.entries(costsByArea).sort((a, b) => b.1 - a.1);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto sm:p-10">
        <style>
          {`
            @media print {
              body {
                visibility: hidden;
              }
              #printable-cost-report, #printable-cost-report * {
                visibility: visible;
              }
              #printable-cost-report {
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
        <div id="printable-cost-report" ref={contentRef} className="space-y-8 text-foreground">
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
              <h1 className="text-3xl font-bold text-primary mb-2">PROJECT COST REPORT</h1>
              <div className="text-sm space-y-1">
                <p><span className="font-semibold">Project:</span> {project.name}</p>
                <p><span className="font-semibold">Client:</span> {project.clientName}</p>
                <p><span className="font-semibold">Date:</span> {format(new Date(), 'PPP')}</p>
              </div>
            </div>
          </div>
          {/* Executive Summary */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/20 rounded-lg border">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
              <p className="text-xl font-bold">{formatCurrency(project.budget)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Cost (Inc. Fees)</p>
              <p className="text-xl font-bold">{formatCurrency(totalCost)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Remaining Budget</p>
              <p className={`text-xl font-bold ${project.budget - totalCost < 0 ? 'text-destructive' : 'text-green-600'}`}>
                {formatCurrency(project.budget - totalCost)}
              </p>
            </div>
          </div>
          {/* Cost Breakdown by Stage */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Cost Breakdown by Work Stage</h3>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold text-foreground">Work Stage</TableHead>
                    <TableHead className="text-right font-bold text-foreground">Total Amount</TableHead>
                    <TableHead className="text-right font-bold text-foreground">% of Expenses</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedStages.map(([stage, amount]) => (
                    <TableRow key={stage}>
                      <TableCell>{stage}</TableCell>
                      <TableCell className="text-right">{formatCurrency(amount)}</TableCell>
                      <TableCell className="text-right">
                        {totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : 0}%
                      </TableCell>
                    </TableRow>
                  ))}
                  {sortedStages.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-4">No expenses recorded yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          {/* Cost Breakdown by Area */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Cost Breakdown by Area / Unit</h3>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold text-foreground">Area / Unit</TableHead>
                    <TableHead className="text-right font-bold text-foreground">Total Amount</TableHead>
                    <TableHead className="text-right font-bold text-foreground">% of Base Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAreas.map(([area, amount]) => (
                    <TableRow key={area}>
                      <TableCell>{area}</TableCell>
                      <TableCell className="text-right">{formatCurrency(amount)}</TableCell>
                      <TableCell className="text-right">
                        {baseCost > 0 ? ((amount / baseCost) * 100).toFixed(1) : 0}%
                      </TableCell>
                    </TableRow>
                  ))}
                  {sortedAreas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-4">No costs recorded yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          {/* Footer Disclaimer */}
          <div className="text-center text-xs text-muted-foreground pt-8 border-t mt-8">
            <p>This report is generated automatically based on current project data.</p>
          </div>
        </div>
        <DialogFooter className="no-print sm:justify-between gap-2">
           <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
           <Button onClick={handlePrint}>
             <Printer className="mr-2 h-4 w-4" />
             Print Report
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}