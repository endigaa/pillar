import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Calculator,
  Settings,
  User,
  Briefcase,
  FileText,
  LayoutDashboard,
  Truck,
  Wrench,
  Building,
  FileSignature
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const { items } = useGlobalSearch();
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    const openHandler = () => setOpen(true);
    document.addEventListener("keydown", down);
    document.addEventListener("open-command-palette", openHandler);
    return () => {
      document.removeEventListener("keydown", down);
      document.removeEventListener("open-command-palette", openHandler);
    };
  }, []);
  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);
  // Group items by type
  const projects = items.filter((i) => i.type === "Project");
  const clients = items.filter((i) => i.type === "Client");
  const invoices = items.filter((i) => i.type === "Invoice");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 shadow-lg max-w-2xl">
        <DialogTitle className="sr-only">Global Search</DialogTitle>
        <DialogDescription className="sr-only">
          Search for projects, clients, invoices, and pages within the application.
        </DialogDescription>
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Pages">
              <CommandItem onSelect={() => runCommand(() => navigate("/"))}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate("/projects"))}>
                <Briefcase className="mr-2 h-4 w-4" />
                <span>Projects</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate("/clients"))}>
                <User className="mr-2 h-4 w-4" />
                <span>Clients</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate("/invoices"))}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Invoices</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate("/financials"))}>
                <Calculator className="mr-2 h-4 w-4" />
                <span>Financials</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate("/resources"))}>
                <Wrench className="mr-2 h-4 w-4" />
                <span>Resources</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate("/suppliers"))}>
                <Truck className="mr-2 h-4 w-4" />
                <span>Suppliers</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate("/settings"))}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            {projects.length > 0 && (
              <CommandGroup heading="Projects">
                {projects.map((project) => (
                  <CommandItem
                    key={project.id}
                    onSelect={() => runCommand(() => navigate(project.url))}
                    value={`project ${project.title}`}
                  >
                    <Building className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{project.title}</span>
                      <span className="text-xs text-muted-foreground">{project.description}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {clients.length > 0 && (
              <CommandGroup heading="Clients">
                {clients.map((client) => (
                  <CommandItem
                    key={client.id}
                    onSelect={() => runCommand(() => navigate(client.url))}
                    value={`client ${client.title}`}
                  >
                    <User className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{client.title}</span>
                      <span className="text-xs text-muted-foreground">{client.description}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {invoices.length > 0 && (
              <CommandGroup heading="Invoices">
                {invoices.map((invoice) => (
                  <CommandItem
                    key={invoice.id}
                    onSelect={() => runCommand(() => navigate(invoice.url))}
                    value={`invoice ${invoice.title}`}
                  >
                    <FileSignature className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{invoice.title}</span>
                      <span className="text-xs text-muted-foreground">{invoice.description}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}