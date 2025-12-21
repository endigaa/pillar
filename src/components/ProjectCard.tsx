import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@shared/types";
import { Link } from "react-router-dom";
import { calculateProjectFinancials } from "@/lib/utils";
import { useCurrency } from "@/hooks/useCurrency";
interface ProjectCardProps {
  project: Project;
}
export function ProjectCard({ project }: ProjectCardProps) {
  const { totalCost, contractorFee, budgetUtilization } = calculateProjectFinancials(project);
  const { formatCurrency } = useCurrency();
  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'On Hold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Not Started': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }
  return (
    <Link to={`/projects/${project.id}`} className="block transition-all duration-200 hover:scale-105 hover:shadow-xl">
      <Card className="h-full flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-bold text-pretty">{project.name}</CardTitle>
            <Badge className={`whitespace-nowrap ${getStatusColor(project.status)}`}>{project.status}</Badge>
          </div>
          <CardDescription>{project.clientName}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Total Cost</span>
                <span>Budget</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>{formatCurrency(totalCost)}</span>
                <span>{formatCurrency(project.budget)}</span>
              </div>
            </div>
            <div>
              <Progress value={budgetUtilization} aria-label={`${budgetUtilization.toFixed(0)}% budget utilized`} />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-muted-foreground">Fee: {formatCurrency(contractorFee)}</p>
                <p className="text-xs text-muted-foreground">{budgetUtilization.toFixed(0)}% Utilized</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            Due: {new Date(project.endDate).toLocaleDateString()}
          </p>
        </CardFooter>
      </Card>
    </Link>
  );
}