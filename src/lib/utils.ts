import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { startOfDay, endOfDay, isBefore, addYears, subYears, subDays } from 'date-fns';
import type { Project, Expense } from '@shared/types';
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function exportToCsv<T extends Record<string, any>>(filename: string, data: T[]): void {
  if (!data || data.length === 0) {
    console.error("No data to export.");
    return;
  }
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','), // header row
    ...data.map(row =>
      headers.map(fieldName =>
        JSON.stringify(row[fieldName], (key, value) => value === null ? '' : value)
      ).join(',')
    )
  ];
  const csvString = csvRows.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
export function getFinancialYearRange(startMonth: number = 1, startDay: number = 1): { start: Date; end: Date } {
  const now = new Date();
  const currentYear = now.getFullYear();
  const jsStartMonth = startMonth - 1;
  // Create start date for current calendar year
  let start = new Date(currentYear, jsStartMonth, startDay);
  // If today is before the start date of this year, the FY started last year
  if (isBefore(now, start)) {
    start = subYears(start, 1);
  }
  start = startOfDay(start);
  // End date is start date + 1 year - 1 day
  let end = subDays(addYears(start, 1), 1);
  end = endOfDay(end);
  return { start, end };
}
export const calculateTotalExpense = (expense: Expense) => {
  const subtotal = expense.amount;
  const taxAmount = (expense.taxes ?? []).reduce((acc, tax) => acc + (subtotal * (tax.rate / 100)), 0);
  return subtotal + taxAmount;
};
export const calculateProjectFinancials = (project: Project) => {
  const totalExpenses = (project.expenses || []).reduce((sum, expense) => sum + calculateTotalExpense(expense), 0);
  const totalMaterials = (project.worksiteMaterials || []).reduce((sum, item) => {
    // Only count if it has a cost. 
    return sum + (item.quantity * (item.unitCost || 0));
  }, 0);
  const baseCost = totalExpenses + totalMaterials;
  let contractorFee = 0;
  if (project.feeType === 'Fixed') {
    contractorFee = project.feeValue;
  } else {
    // Percentage based
    // Fallback to contractorFeePercentage if feeValue is 0 (backward compatibility)
    const percentage = project.feeValue > 0 ? project.feeValue : (project.contractorFeePercentage || 0);
    contractorFee = baseCost * (percentage / 100);
  }
  const totalCost = baseCost + contractorFee;
  const budgetUtilization = project.budget > 0 ? (totalCost / project.budget) * 100 : 0;
  return {
    totalExpenses,
    totalMaterials,
    baseCost,
    contractorFee,
    totalCost,
    budgetUtilization
  };
};