import { useState, useCallback, ChangeEvent } from 'react';
import { api } from '@/lib/api-client';
import type { ImportedTransaction } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UploadCloud, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
// A simple CSV parser
const parseCSV = (csvText: string): ImportedTransaction[] => {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const requiredHeaders = ['date', 'projectName', 'description', 'amount', 'type'];
  if (!requiredHeaders.every(h => headers.includes(h))) {
    throw new Error('CSV must contain headers: date, projectName, description, amount, type');
  }
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const entry = headers.reduce((obj, header, index) => {
      obj[header] = values[index]?.trim();
      return obj;
    }, {} as any);
    return {
      date: entry.date,
      projectName: entry.projectName,
      description: entry.description,
      amount: parseFloat(entry.amount),
      type: entry.type === 'Expense' || entry.type === 'Deposit' ? entry.type : 'Expense',
    };
  });
};
export function TransactionImporter({ onImportSuccess }: { onImportSuccess: () => void }) {
  const [transactions, setTransactions] = useState<ImportedTransaction[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setTransactions([]);
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const parsedData = parseCSV(text);
          setTransactions(parsedData);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to parse CSV file.');
        }
      };
      reader.readAsText(file);
    }
  };
  const handleSubmit = async () => {
    if (transactions.length === 0) {
      toast.error("No transactions to import.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await api<{
        imported: number;
        failed: number;
        errors: string[];
      }>('/api/transactions/import', {
        method: 'POST',
        body: JSON.stringify(transactions),
      });
      toast.success(`Import complete! ${response.imported} transactions imported.`);
      if (response.failed > 0) {
        toast.warning(`${response.failed} transactions failed to import.`, {
          description: response.errors.join('\n'),
        });
      }
      onImportSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An unknown error occurred during import.');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="space-y-6">
      <label
        htmlFor="csv-upload"
        className="p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors border-border hover:border-primary/50 block"
      >
        <input id="csv-upload" type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
        <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">
          Click to select a CSV file
        </p>
        <p className="text-xs text-muted-foreground mt-1">Required columns: date, projectName, description, amount, type</p>
      </label>
      {fileName && (
        <div className="flex items-center gap-3 p-3 border rounded-md bg-muted/50">
          <File className="h-5 w-5 flex-shrink-0" />
          <span className="flex-1 text-sm font-medium truncate">{fileName}</span>
          {error ? <AlertCircle className="h-5 w-5 text-destructive" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
        </div>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {transactions.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Transaction Preview</h3>
          <ScrollArea className="h-64 border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t, i) => (
                  <TableRow key={i}>
                    <TableCell>{t.date}</TableCell>
                    <TableCell>{t.projectName}</TableCell>
                    <TableCell>{t.description}</TableCell>
                    <TableCell>{t.type}</TableCell>
                    <TableCell className="text-right">${t.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      )}
      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={transactions.length === 0 || !!error || isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Import {transactions.length > 0 ? transactions.length : ''} Transactions
        </Button>
      </div>
    </div>
  );
}