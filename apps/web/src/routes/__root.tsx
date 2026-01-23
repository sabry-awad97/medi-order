import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import "../index.css";

export interface RouterAppContext {}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "نظام إدارة الطلبات الخاصة",
      },
      {
        name: "description",
        content: "نظام إدارة الطلبات الخاصة للصيدلية",
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
  return (
    <>
      <HeadContent />
      <SidebarProvider defaultOpen={true}>
        <div className="flex h-screen w-full overflow-hidden">
          <AppSidebar />
          <SidebarInset className="flex flex-col flex-1 min-w-0">
            <header
              className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-dashed bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 px-4"
              dir="rtl"
            >
              <SidebarTrigger className="ml-2" />
              <div className="flex-1" />
            </header>
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
