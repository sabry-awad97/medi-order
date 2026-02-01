import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
  Link,
  useRouterState,
  useNavigate,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import {
  createContext,
  useContext,
  useEffect,
  lazy,
  type ReactNode,
} from "react";
import { useDirection } from "@meditrack/i18n";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useCheckFirstRun } from "@/hooks/use-onboarding-db";
import { Loading } from "@/components/ui/loading";
import { NotFoundPage } from "@/routes/404";
import "../index.css";

// Lazy load AppSidebar (only needed for authenticated routes)
const AppSidebar = lazy(() =>
  import("@/components/layout").then((m) => ({ default: m.AppSidebar })),
);

export interface RouterAppContext {}

// Context للعنوان والعنوان الفرعي
interface PageHeaderContextType {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

const PageHeaderContext = createContext<PageHeaderContextType>({});

export const usePageHeader = () => useContext(PageHeaderContext);

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  head: () => ({
    meta: [
      {
        title: "MediTrack - Professional Pharmacy Management System with AI",
      },
      {
        name: "description",
        content:
          "Professional pharmacy management system for everything with AI",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
});

function RootComponent() {
  const { direction } = useDirection();
  const router = useRouterState();
  const navigate = useNavigate();

  // Check for first-run at root level
  const { data: isFirstRun, isLoading: isCheckingFirstRun } =
    useCheckFirstRun();

  const currentPath = router.location.pathname;
  const isOnboarding = currentPath === "/onboarding";
  const isLogin = currentPath === "/login";
  const isNoLayoutRoute = isOnboarding || isLogin;

  // Redirect to onboarding if first run (BEFORE any other checks)
  useEffect(() => {
    if (!isCheckingFirstRun && isFirstRun && !isOnboarding) {
      console.log("🔄 First run detected, redirecting to onboarding");
      navigate({ to: "/onboarding" });
    }
  }, [isFirstRun, isCheckingFirstRun, isOnboarding, navigate]);

  // Show loading while checking first run OR when first run is detected (to prevent layout flash)
  if (isCheckingFirstRun || (isFirstRun && !isOnboarding)) {
    return <Loading />;
  }

  // Render without layout for login/onboarding routes
  if (isNoLayoutRoute) {
    return (
      <>
        <HeadContent />
        <Outlet />
        {import.meta.env.DEV && (
          <TanStackRouterDevtools position="bottom-left" />
        )}
      </>
    );
  }

  // Regular layout with sidebar for authenticated routes
  // Only render if NOT first run (prevents sidebar rendering during redirect)
  if (isFirstRun) {
    return <Loading />;
  }
  return (
    <>
      <HeadContent />
      <SidebarProvider defaultOpen={true}>
        <div className="flex h-screen w-full overflow-hidden" dir={direction}>
          <AppSidebar />
          <SidebarInset className="flex flex-col flex-1 min-w-0">
            <main className="flex-1 overflow-y-auto overflow-x-hidden">
              <Outlet />
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-left" />}
    </>
  );
}

function NotFoundComponent() {
  return <NotFoundPage />;
}
