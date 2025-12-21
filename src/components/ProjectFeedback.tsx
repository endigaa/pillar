import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { ClientFeedback } from '@shared/types';
import { format } from 'date-fns';
import { MessageSquare, CheckCircle2, Reply, Loader2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
interface ProjectFeedbackProps {
  feedback: ClientFeedback[];
}
export function ProjectFeedback({ feedback = [] }: ProjectFeedbackProps) {
  const { id: projectId } = useParams<{ id: string }>();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleAcknowledge = async (feedbackId: string) => {
    if (!projectId) return;
    try {
      await api(`/api/projects/${projectId}/feedback/${feedbackId}/acknowledge`, {
        method: 'PUT',
      });
      toast.success('Feedback acknowledged');
      // Trigger refresh via parent or context if possible, otherwise rely on optimistic UI or reload
      window.location.reload(); // Simple reload for now to refresh state
    } catch (err) {
      toast.error('Failed to acknowledge feedback');
    }
  };
  const handleReply = async (feedbackId: string) => {
    if (!projectId || !replyMessage.trim()) return;
    setIsSubmitting(true);
    try {
      await api(`/api/projects/${projectId}/feedback/${feedbackId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ response: replyMessage }),
      });
      toast.success('Response sent');
      setReplyingTo(null);
      setReplyMessage('');
      window.location.reload();
    } catch (err) {
      toast.error('Failed to send response');
    } finally {
      setIsSubmitting(false);
    }
  };
  const sortedFeedback = [...feedback].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle>Client Feedback</CardTitle>
        <CardDescription>Messages and feedback received from the client portal.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {sortedFeedback.length > 0 ? (
              sortedFeedback.map((item) => (
                <div key={item.id} className="flex flex-col gap-2 p-4 border rounded-lg bg-muted/30">
                  <div className="flex gap-4">
                    <div className="mt-1">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium leading-none">Client Message</p>
                          {item.acknowledged && <Badge variant="outline" className="text-green-600 border-green-600 text-[10px] px-1 py-0">Acknowledged</Badge>}
                        </div>
                        <span className="text-xs text-muted-foreground">{format(new Date(item.date), 'PP p')}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.message}</p>
                    </div>
                  </div>
                  {/* Contractor Response */}
                  {item.response && (
                    <div className="ml-12 mt-2 p-3 bg-background border rounded-md">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-primary">You responded:</span>
                        {item.respondedAt && <span className="text-xs text-muted-foreground">{format(new Date(item.respondedAt), 'PP p')}</span>}
                      </div>
                      <p className="text-sm">{item.response}</p>
                    </div>
                  )}
                  {/* Actions */}
                  <div className="flex justify-end gap-2 mt-2">
                    {!item.acknowledged && !item.response && (
                      <Button variant="outline" size="sm" onClick={() => handleAcknowledge(item.id)}>
                        <CheckCircle2 className="mr-2 h-3 w-3" />
                        Acknowledge
                      </Button>
                    )}
                    {!item.response && replyingTo !== item.id && (
                      <Button variant="ghost" size="sm" onClick={() => setReplyingTo(item.id)}>
                        <Reply className="mr-2 h-3 w-3" />
                        Reply
                      </Button>
                    )}
                  </div>
                  {/* Reply Input */}
                  {replyingTo === item.id && (
                    <div className="ml-12 mt-2 space-y-2">
                      <Textarea
                        placeholder="Type your response..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        className="min-h-[80px]"
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { setReplyingTo(null); setReplyMessage(''); }}>Cancel</Button>
                        <Button size="sm" onClick={() => handleReply(item.id)} disabled={isSubmitting || !replyMessage.trim()}>
                          {isSubmitting && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                          Send Response
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground/20 mb-4" />
                <p className="text-muted-foreground">No feedback received yet.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}