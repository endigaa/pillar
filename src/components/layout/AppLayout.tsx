import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/AppHeader";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "@/components/GlobalSearch";
type AppLayoutProps = {
  children: React.ReactNode;
  container?: boolean;
  className?: string;
  contentClassName?: string;
};
export function AppLayout({ children, container = true, className, contentClassName }: AppLayoutProps): JSX.Element {
  return (
    <SidebarProvider>
      <GlobalSearch />
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden scrollbar-stable w-full">
          <AppHeader />
          <main className="flex-1 w-full">
            <div className={cn("py-8 px-6 w-full", className)}>
              {container ? (
                <div className={cn("w-full max-w-7xl mx-auto", contentClassName)}>
                  {children}
                </div>
              ) : (
                children
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}