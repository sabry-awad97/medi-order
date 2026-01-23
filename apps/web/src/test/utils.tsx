import type { ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";
import { SidebarProvider } from "@/components/ui/sidebar";

// Create a custom render function that includes providers
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface AllTheProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

function AllTheProviders({ children, queryClient }: AllTheProvidersProps) {
  const client = queryClient || createTestQueryClient();

  return (
    <QueryClientProvider client={client}>
      <SidebarProvider>{children}</SidebarProvider>
    </QueryClientProvider>
  );
}

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
}

function customRender(ui: ReactElement, options?: CustomRenderOptions) {
  const { queryClient, ...renderOptions } = options || {};

  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
    ),
    ...renderOptions,
  });
}

// Router test utilities
interface RenderWithRouterOptions extends CustomRenderOptions {
  initialEntries?: string[];
  initialIndex?: number;
}

function renderWithRouter(
  component: ReactElement,
  options?: RenderWithRouterOptions,
) {
  const {
    initialEntries = ["/"],
    initialIndex = 0,
    queryClient,
    ...renderOptions
  } = options || {};

  const history = createMemoryHistory({
    initialEntries,
    initialIndex,
  });

  const rootRoute = createRootRoute({
    component: () => component,
  });

  const router = createRouter({
    routeTree: rootRoute,
    history,
  });

  return {
    ...customRender(<RouterProvider router={router} />, {
      queryClient,
      ...renderOptions,
    }),
    router,
    history,
  };
}

// Re-export everything
export * from "@testing-library/react";
export { customRender as render, renderWithRouter, createTestQueryClient };
