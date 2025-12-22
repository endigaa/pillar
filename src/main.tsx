import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import '@/index.css'
import { HomePage } from '@/pages/HomePage'
import { ProjectPage } from '@/pages/ProjectPage';
import { FinancialsPage } from '@/pages/FinancialsPage';
import { ClientsPage } from '@/pages/ClientsPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { ClientPortalPage } from '@/pages/ClientPortalPage';
import { ResourceManagementPage } from './pages/ResourceManagementPage';
import { SupplierManagementPage } from './pages/SupplierManagementPage';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SettingsPage } from './pages/SettingsPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { InvoiceDetailPage } from './pages/InvoiceDetailPage';
import { ClientStatementPage } from './pages/ClientStatementPage';
import { SupplierDetailPage } from './pages/SupplierDetailPage';
import { HelpPage } from './pages/HelpPage';
import { SchedulePage } from './pages/SchedulePage';
import { AppInitializer } from './components/AppInitializer';
const router = createBrowserRouter([
  {
    element: <AppInitializer />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: "/portal/:id",
        element: <ClientPortalPage />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: "/",
        element: <ProtectedRoute />,
        errorElement: <RouteErrorBoundary />,
        children: [
          {
            path: "/",
            element: <HomePage />,
          },
          {
            path: "/schedule",
            element: <SchedulePage />,
          },
          {
            path: "/projects",
            element: <ProjectsPage />,
          },
          {
            path: "/projects/:id",
            element: <ProjectPage />,
          },
          {
            path: "/invoices",
            element: <InvoicesPage />,
          },
          {
            path: "/invoices/:id",
            element: <InvoiceDetailPage />,
          },
          {
            path: "/financials",
            element: <FinancialsPage />,
          },
          {
            path: "/clients",
            element: <ClientsPage />,
          },
          {
            path: "/clients/:id/statement",
            element: <ClientStatementPage />,
          },
          {
            path: "/resources",
            element: <ResourceManagementPage />,
          },
          {
            path: "/suppliers",
            element: <SupplierManagementPage />,
          },
          {
            path: "/suppliers/:id",
            element: <SupplierDetailPage />,
          },
          {
            path: "/settings",
            element: <SettingsPage />,
          },
          {
            path: "/help",
            element: <HelpPage />,
          },
        ],
      },
    ]
  }
]);
// Do not touch this code
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>,
)