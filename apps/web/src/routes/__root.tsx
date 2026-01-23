import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { createContext, useContext, type ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
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
