import React from "react";
import { LayoutDashboard, Briefcase, Users, BarChart2, Settings, Building, Wrench, Truck, FileText, HelpCircle, Calendar } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useLocation } from "react-router-dom";
const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/schedule", icon: Calendar, label: "Schedule" },
  { href: "/projects", icon: Briefcase, label: "Projects" },
  { href: "/clients", icon: Users, label: "Clients" },
  { href: "/invoices", icon: FileText, label: "Invoices" },
  { href: "/financials", icon: BarChart2, label: "Financials" },
  { href: "/resources", icon: Wrench, label: "Resources" },
  { href: "/suppliers", icon: Truck, label: "Suppliers" },
  { href: "/help", icon: HelpCircle, label: "Help & Guide" },
  { href: "/settings", icon: Settings, label: "Settings" },
];
export function AppSidebar(): JSX.Element {
  const location = useLocation();
  const isActive = (item: typeof navItems[0]) => {
    if (item.exact) {
      return location.pathname === item.href;
    }
    // Special case for projects on dashboard
    if (item.href === '/projects' && location.pathname === '/') return true;
    return location.pathname.startsWith(item.href);
  };
  return (
    <Sidebar>
      <SidebarHeader>
        <a href="/" className="flex items-center gap-2 px-2 py-1">
          <Building className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">Pillar</span>
        </a>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href + item.label}>
              <SidebarMenuButton asChild isActive={isActive(item)}>
                <a href={item.href}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}