import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  error: Error | null;
}
export class SampleErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // In a real application, you would log this to an error reporting service
    console.error("SampleErrorBoundary caught an error:", error, errorInfo);
  }
  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };
  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-destructive/50 bg-destructive/5 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle>Something went wrong</CardTitle>
            </div>
            <CardDescription>
              This is a sample error boundary catching a simulated crash. The rest of the app remains functional.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono bg-background p-3 rounded border border-destructive/20 text-destructive overflow-auto max-h-32">
              {this.state.error?.message || "Unknown error occurred"}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={this.handleReset} className="w-full sm:w-auto hover:bg-destructive/10 hover:text-destructive border-destructive/30">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardFooter>
        </Card>
      );
    }
    return this.props.children;
  }
}