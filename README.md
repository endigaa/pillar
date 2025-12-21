# Pillar
[cloudflarebutton]
Pillar is a sophisticated, all-in-one project management and financial tracking platform designed exclusively for construction contractors. It streamlines the entire project lifecycle, from initial quoting to final client handover. The core functionality allows contractors to create and manage multiple projects, meticulously track every expense against a Bill of Materials (BOM), and automatically calculate their fees based on a set percentage. For client transparency, Pillar provides a secure, shareable portal where clients can deposit funds, view real-time fund utilization, and see visual progress through uploaded photos. The platform also features a robust financial suite, including a ledger, balance sheet, and profit & loss statements, giving contractors a clear view of their business health.
## Key Features
- **Project & Expense Management**: Create projects and track every expense against a detailed Bill of Materials (BOM).
- **Automated Fee Calculation**: Automatically calculate contractor fees as a percentage of the total project cost.
- **Transparent Client Portal**: Provide clients with a secure, read-only portal to view fund utilization and visual progress updates.
- **Comprehensive Financial Reporting**: Access a full suite of financial tools, including a ledger, Profit & Loss statements, and Balance Sheets.
- **Resource Management**: Manage tool inventory and maintain a directory of sub-contractors with their specializations.
- **Supplier & Quoting System**: Keep a database of suppliers and material costs to generate fast, accurate quotes for change orders.
## Technology Stack
- **Frontend**: React, Vite, React Router, Tailwind CSS, shadcn/ui
- **State Management**: Zustand
- **Backend**: Cloudflare Workers, Hono
- **Storage**: Cloudflare Durable Objects
- **UI/UX**: Framer Motion (animations), Lucide React (icons), Recharts (charts)
- **Language**: TypeScript
- **Runtime & Tooling**: Bun, Wrangler
## Key Project Libraries & Their Purpose
### Frontend
- **[React](https://react.dev/)**: The core library for building the user interface, enabling a component-based architecture.
- **[Vite](https://vitejs.dev/)**: A next-generation build tool that provides a fast development server and optimized production builds.
- **[Tailwind CSS](https://tailwindcss.com/)**: A utility-first CSS framework for rapid UI development and consistent styling.
- **[shadcn/ui](https://ui.shadcn.com/)**: A collection of re-usable components built with Radix UI and Tailwind CSS, providing accessible and customizable UI elements.
- **[Zustand](https://github.com/pmndrs/zustand)**: A small, fast, and scalable state-management solution used for handling global application state (e.g., authentication, notifications).
- **[React Router](https://reactrouter.com/)**: Handles client-side routing, enabling navigation between different views without page reloads.
- **[React Hook Form](https://react-hook-form.com/)**: Manages form state and validation efficiently, minimizing re-renders.
- **[Zod](https://zod.dev/)**: A TypeScript-first schema declaration and validation library, used extensively for form validation and type safety.
- **[Recharts](https://recharts.org/)**: A composable charting library built on React components, used for financial data visualization.
- **[Lucide React](https://lucide.dev/)**: A clean and consistent icon library for enhancing UI visual cues.
- **[Framer Motion](https://www.framer.com/motion/)**: A production-ready motion library for React, used to add smooth animations and micro-interactions.
### Backend & Infrastructure
- **[Hono](https://hono.dev/)**: A small, ultrafast web framework for the Edges, used to build the API running on Cloudflare Workers.
- **[Cloudflare Workers](https://workers.cloudflare.com/)**: A serverless execution environment that runs the backend code at the edge, close to users.
- **[Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/)**: Provides low-latency coordination and consistent storage for the application's data entities (Projects, Clients, etc.).
## Getting Started
Follow these instructions to get the project up and running on your local machine for development and testing purposes.
### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later)
- [Bun](https://bun.sh/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) logged into your Cloudflare account.
```bash
npm install -g wrangler
wrangler login
```
### Installation
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/pillar_construction_manager.git
    cd pillar_construction_manager
    ```
2.  **Install dependencies:**
    This project uses Bun for package management.
    ```bash
    bun install
    ```
3.  **Local Environment Variables:**
    Create a `.dev.vars` file in the root of the project for local development with wrangler. This is not strictly necessary for the initial setup but will be useful for managing secrets.
## Running Locally
To start the development server for both the frontend and the backend worker, run:
```bash
bun dev
```
This command will:
- Start the Vite development server for the React frontend, typically on `http://localhost:3000`.
- Start the Wrangler development server for the Hono backend, which the frontend will proxy API requests to.
You can now open your browser and navigate to `http://localhost:3000` to see the application.
## Project Structure
The codebase is organized into three main directories:
-   `src/`: Contains the entire React frontend application, including pages, components, hooks, and utility functions.
-   `worker/`: Contains the Cloudflare Worker backend code, built with Hono. This is where API routes and data logic reside.
-   `shared/`: Contains TypeScript types and interfaces that are shared between the frontend and the backend to ensure type safety.
## Development
### Backend
-   **API Routes**: New API endpoints should be added in `worker/user-routes.ts`.
-   **Data Entities**: Data models and their interaction logic with Durable Objects are defined in `worker/entities.ts`. Extend the `IndexedEntity` class to create new data types.
### Frontend
-   **Pages**: New views or pages should be created in the `src/pages` directory.
-   **Components**: Reusable UI components are located in `src/components`. We leverage `shadcn/ui`, so prefer using or extending existing components from `src/components/ui`.
-   **API Calls**: Use the `api()` helper function in `src/lib/api-client.ts` to make type-safe requests to the backend.
## Deployment
This application is designed to be deployed to the Cloudflare global network.
### One-Click Deploy
You can deploy this project with a single click using the button below.
[cloudflarebutton]
### Manual Deployment
1.  **Build the application:**
    This command bundles both the frontend and the worker for production.
    ```bash
    bun build
    ```
2.  **Deploy to Cloudflare:**
    This command publishes your application to your Cloudflare account.
    ```bash
    bun deploy
    ```
Wrangler will handle the process of uploading the assets and the worker script, making your application live on your configured `*.workers.dev` subdomain or custom domain.
## Troubleshooting
### Git Clone Error: "could not determine hash algorithm"
If you encounter the error `fatal: not valid: could not determine hash algorithm; is this a git repository?` when trying to clone or pull the repository, it typically indicates a mismatch between the Git version used to create the repository and your local Git version.
**Solution:**
1.  **Update Git**: Ensure you are using a recent version of Git (v2.29 or later).
    -   **Mac**: `brew upgrade git`
    -   **Windows**: Download the latest installer from [git-scm.com](https://git-scm.com/).
    -   **Linux**: Use your package manager (e.g., `sudo apt update && sudo apt install git`).
2.  **Re-clone**: After updating, try cloning the repository again.
### "Is there a reedy?" (README)
Yes, this file serves as the central documentation (README) for the project. It covers:
-   **Key Features**: What the application does.
-   **Technology Stack**: The tools used to build it.
-   **Getting Started**: How to install and run the app locally.
-   **Project Structure**: Where to find code files.
-   **Deployment**: How to publish the app.
If you have further questions, please refer to the "Help & Guide" page within the application itself (accessible via the sidebar) for a detailed user manual.