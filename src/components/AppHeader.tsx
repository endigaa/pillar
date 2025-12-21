import { useState, useEffect } from 'react';
import { Building, PlusCircle, Bell, AlertCircle, CalendarCheck2, Search, MessageSquare, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ThemeToggle } from './ThemeToggle';
import { NewProjectForm } from './NewProjectForm';
import { api } from '@/lib/api-client';
import type { Project } from '@shared/types';
import { Toaster, toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { Skeleton } from './ui/skeleton';
export function AppHeader() {
  const [isNewProjectOpen, setNewProjectOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { profile, isLoading: isProfileLoading, fetchProfile } = useCompanyProfile();
  const { notifications, fetchNotifications } = useNotifications();
  useEffect(() => {
    fetchProfile();
    fetchNotifications();
  }, [fetchProfile, fetchNotifications]);
  const handleCreateProject = async (values: Omit<Project, 'id' | 'expenses' | 'clientName' | 'status' | 'deposits' | 'photos' | 'tasks' | 'clientDocuments' | 'invoiceIds' | 'worksiteMaterials' | 'quoteIds' | 'journalEntries' | 'clientFeedback' | 'changeOrderIds' | 'planStages'>) => {
    try {
      const newProject = await api<Project>('/api/projects', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      toast.success('Project created successfully!');
      setNewProjectOpen(false);
      navigate(`/projects/${newProject.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create project.');
    }
  };
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const handleOpenSearch = () => {
    document.dispatchEvent(new CustomEvent('open-command-palette'));
  };
  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
          <div className="flex gap-6 md:gap-10">
            <a href="/" className="flex items-center space-x-2">
              {isProfileLoading ? <Skeleton className="h-6 w-6" /> : <Building className="h-6 w-6 text-primary" />}
              {isProfileLoading ? <Skeleton className="h-6 w-24" /> : <span className="inline-block font-bold text-lg">{profile?.companyName || 'Pillar'}</span>}
            </a>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2 text-muted-foreground"
                onClick={handleOpenSearch}
              >
                <Search className="h-4 w-4 xl:mr-2" />
                <span className="hidden xl:inline-flex">Search...</span>
                <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex"><span className="text-xs">⌘</span>K</kbd>
              </Button>
              <Dialog open={isNewProjectOpen} onOpenChange={setNewProjectOpen}>
                <Button onClick={() => setNewProjectOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Project
                </Button>
                <DialogContent className="sm:max-w-[525px]">
                  <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>Fill in the details below to start a new construction project.</DialogDescription>
                  </DialogHeader>
                  <NewProjectForm onSubmit={handleCreateProject} onFinished={() => setNewProjectOpen(false)} />
                </DialogContent>
              </Dialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {notifications.length > 0 && (
                      <span className="absolute top-0 right-0 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80" align="end">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length > 0 ? (
                    notifications.map(notification => (
                      <DropdownMenuItem
                        key={notification.id}
                        onSelect={() => {
                            if (notification.link) {
                                navigate(notification.link);
                            } else if (notification.projectId) {
                                navigate(`/projects/${notification.projectId}`);
                            }
                        }}
                        className="cursor-pointer"
                      >
                        {notification.type === 'task' && <AlertCircle className="mr-2 h-4 w-4 text-red-500" />}
                        {notification.type === 'project' && <CalendarCheck2 className="mr-2 h-4 w-4 text-yellow-500" />}
                        {notification.type === 'feedback' && <MessageSquare className="mr-2 h-4 w-4 text-blue-500" />}
                        {notification.type === 'inventory' && <Wrench className="mr-2 h-4 w-4 text-orange-500" />}
                        <span className="text-sm text-wrap">{notification.message}</span>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                      You're all caught up!
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <ThemeToggle className="relative" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Contractor" />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Contractor</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        contractor@pillar.com
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/settings')}>Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>
        </div>
      </header>
      <Toaster richColors />
    </>
  );
}