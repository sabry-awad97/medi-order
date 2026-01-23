import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Package,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronDown,
  Pill,
  Bell,
  Moon,
  Sun,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "@/components/theme-provider";
import { useAlertStats } from "@/hooks";

// عناصر القائمة الرئيسية
const mainMenuItems = [
  {
    title: "الصفحة الرئيسية",
    url: "/",
    icon: Home,
  },
  {
    title: "الطلبات الخاصة",
    url: "/pharmacy",
    icon: Package,
    badge: true,
  },
  {
    title: "الموردين",
    url: "/suppliers",
    icon: Users,
  },
  {
    title: "التقارير",
    url: "/reports",
    icon: BarChart3,
  },
];

// عناصر القائمة الثانوية
const secondaryMenuItems = [
  {
    title: "الإعدادات",
    url: "/settings",
    icon: Settings,
  },
  {
    title: "المساعدة",
    url: "/help",
    icon: HelpCircle,
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { theme, setTheme } = useTheme();
  const { data: alertStats } = useAlertStats();

  const totalAlerts =
    (alertStats?.oldOrders || 0) +
    (alertStats?.notPickedUp || 0) +
    (alertStats?.delayed || 0);

  return (
    <Sidebar collapsible="icon" side="right" className="border-l">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-2">
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg shrink-0">
                <Pill className="size-4" />
              </div>
              <div className="grid flex-1 text-right text-sm leading-tight min-w-0 group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold">
                  نظام الطلبات الخاصة
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  إدارة الصيدلية
                </span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>القائمة الرئيسية</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => {
                const isActive = currentPath === item.url;
                const showBadge = item.badge && totalAlerts > 0;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={state === "collapsed" ? item.title : undefined}
                    >
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="shrink-0 size-4" />
                        <span className="flex-1 text-right">{item.title}</span>
                        {showBadge && (
                          <SidebarMenuBadge>{totalAlerts}</SidebarMenuBadge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>أخرى</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryMenuItems.map((item) => {
                const isActive = currentPath === item.url;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={state === "collapsed" ? item.title : undefined}
                    >
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="shrink-0 size-4" />
                        <span className="flex-1 text-right">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>المظهر</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  tooltip={
                    state === "collapsed"
                      ? theme === "dark"
                        ? "الوضع الفاتح"
                        : "الوضع الداكن"
                      : undefined
                  }
                  className="flex items-center gap-2"
                >
                  {theme === "dark" ? (
                    <Sun className="shrink-0 size-4" />
                  ) : (
                    <Moon className="shrink-0 size-4" />
                  )}
                  <span className="flex-1 text-right">
                    {theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu dir="rtl">
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex items-center gap-2 w-full">
                    <Avatar className="h-8 w-8 rounded-lg shrink-0">
                      <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                        ص
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-right text-sm leading-tight min-w-0">
                      <span className="truncate font-semibold">الصيدلية</span>
                      <span className="truncate text-xs text-muted-foreground">
                        صيدلي
                      </span>
                    </div>
                    <ChevronDown className="mr-auto shrink-0 size-4" />
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem className="cursor-pointer flex items-center gap-2">
                  <Settings className="h-4 w-4 shrink-0" />
                  <span>الإعدادات</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer flex items-center gap-2">
                  <Bell className="h-4 w-4 shrink-0" />
                  <span>الإشعارات</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 shrink-0" />
                  <span>المساعدة</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
