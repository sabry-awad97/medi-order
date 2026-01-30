import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
  Link,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  Home,
  ArrowRight,
  ArrowLeft,
  Search,
  FileQuestion,
} from "lucide-react";
import { useDirection, useTranslation } from "@meditrack/i18n";
import { invoke } from "@tauri-apps/api/core";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Page, PageContent, PageContentInner } from "@/components/ui/page";
import "../index.css";

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
  const [isFirstRun, setIsFirstRun] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkFirstRun();
  }, []);

  const checkFirstRun = async () => {
    try {
      const response = await invoke<{ data: boolean }>("check_first_run");
      setIsFirstRun(response.data);

      // Redirect to onboarding if first run and not already there
      if (response.data && router.location.pathname !== "/onboarding") {
        window.location.href = "/onboarding";
      }
    } catch (error) {
      console.error("Failed to check first run:", error);
      setIsFirstRun(false);
    } finally {
      setIsChecking(false);
    }
  };

  // Show loading state while checking first run
  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if current route is login or onboarding (no sidebar/layout)
  const noLayoutRoutes = ["/login", "/onboarding"];
  const isNoLayoutRoute = noLayoutRoutes.includes(router.location.pathname);

  // If login/onboarding route, render without sidebar
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
  const { t } = useTranslation("common");
  const { isRTL } = useDirection();
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <Page>
      <PageContent>
        <PageContentInner className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-2xl mx-auto px-6 py-16">
            {/* Icon and number */}
            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              </div>
              <div className="relative">
                <FileQuestion className="h-32 w-32 mx-auto text-muted-foreground/40 mb-4" />
                <h1 className="text-9xl font-bold text-primary/10 select-none">
                  404
                </h1>
              </div>
            </div>

            {/* Title and description */}
            <div className="space-y-4 mb-8">
              <h2 className="text-3xl font-bold">{t("notFound.title")}</h2>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                {t("notFound.description")}
              </p>
            </div>

            {/* Useful links */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  size="lg"
                  className="gap-2 w-full sm:w-auto"
                  render={(props) => <Link to="/" {...props} />}
                >
                  <Home className="h-5 w-5" />
                  {t("notFound.backToHome")}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2 w-full sm:w-auto"
                  render={(props) => <Link to="/special-orders" {...props} />}
                >
                  <Search className="h-5 w-5" />
                  {t("navigation.orders")}
                </Button>
              </div>

              {/* Quick links */}
              <div className="pt-8 border-t border-dashed">
                <p className="text-sm text-muted-foreground mb-4">
                  {t("notFound.goTo")}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    render={(props) => <Link to="/special-orders" {...props} />}
                  >
                    {t("navigation.orders")}
                    <ArrowIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    render={(props) => <Link to="/suppliers" {...props} />}
                  >
                    {t("navigation.suppliers")}
                    <ArrowIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    render={(props) => <Link to="/reports" {...props} />}
                  >
                    {t("navigation.reports")}
                    <ArrowIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </PageContentInner>
      </PageContent>
    </Page>
  );
}
