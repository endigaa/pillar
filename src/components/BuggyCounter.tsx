import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Zap } from 'lucide-react';
export function BuggyCounter() {
  const [count, setCount] = useState(0);
  if (count === 5) {
    throw new Error("Simulated crash! You clicked 5 times.");
  }
  return (
    <div className="flex flex-col items-center gap-4 p-6 border rounded-lg bg-muted/20 text-center">
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2 text-foreground font-semibold">
          <Zap className="h-4 w-4 text-yellow-500" />
          <h3>Interactive Crash Test</h3>
        </div>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Click the button below to increment the counter. When it reaches 5, this component will intentionally crash to demonstrate the Error Boundary.
        </p>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Button
          variant={count === 4 ? "destructive" : "default"}
          onClick={() => setCount(c => c + 1)}
          className="w-40 transition-all"
        >
          {count === 4 ? <AlertTriangle className="mr-2 h-4 w-4" /> : null}
          Count: {count}
        </Button>
        <p className={`text-xs font-medium transition-colors ${count === 4 ? "text-destructive animate-pulse" : "text-muted-foreground"}`}>
          {count === 4 ? "Warning: Next click will crash!" : "Safe zone"}
        </p>
      </div>
    </div>
  );
}