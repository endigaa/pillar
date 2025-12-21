import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/lib/api-client';
import type { JournalEntry } from '@shared/types';
import { toast } from 'sonner';
import { Loader2, Send } from 'lucide-react';
import { format } from 'date-fns';
interface ProjectJournalProps {
  projectId: string;
  entries: JournalEntry[];
  onEntryAdded: () => void;
}
export function ProjectJournal({ projectId, entries = [], onEntryAdded }: ProjectJournalProps) {
  const [newEntry, setNewEntry] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async () => {
    if (!newEntry.trim()) return;
    setIsSubmitting(true);
    try {
      await api(`/api/projects/${projectId}/journal`, {
        method: 'POST',
        body: JSON.stringify({
          content: newEntry,
          date: new Date().toISOString(),
          author: 'Contractor', // In a real app, this would come from auth context
        }),
      });
      setNewEntry('');
      toast.success('Journal entry added');
      onEntryAdded();
    } catch (err) {
      toast.error('Failed to add journal entry');
    } finally {
      setIsSubmitting(false);
    }
  };
  // Safe copy for sorting to avoid mutating props and ensure array exists
  const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="h-[600px] flex flex-col">
        <CardHeader>
          <CardTitle>Project Journal</CardTitle>
          <CardDescription>Record notes, thoughts, and updates.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {sortedEntries.length > 0 ? (
                sortedEntries.map((entry) => (
                  <div key={entry.id} className="flex flex-col gap-1 p-4 border rounded-lg bg-muted/30">
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span className="font-semibold">{entry.author}</span>
                      <span>{format(new Date(entry.date), 'PP p')}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{entry.content}</p>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No journal entries yet.
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="flex gap-2 mt-auto pt-4 border-t">
            <Textarea
              placeholder="Write a new entry..."
              value={newEntry}
              onChange={(e) => setNewEntry(e.target.value)}
              className="min-h-[80px]"
            />
            <Button
              size="icon"
              className="h-auto w-12 self-end"
              onClick={handleSubmit}
              disabled={isSubmitting || !newEntry.trim()}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}