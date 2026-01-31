import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
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
  Languages,
  LogOut,
} from "lucide-react";
import { useEffect, useRef } from "react";

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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "@/components/theme-provider";
import { useAlertStats, useSettingValue, useUpsertSettingValue } from "@/hooks";
import {
  useLocale,
  LOCALES,
  useTranslation,
  useDirection,
} from "@meditrack/i18n";
import { useAuth } from "@/hooks/use-auth";
import { getSettingDefinition } from "@/lib/constants";
import {
  SETTING_SIDEBAR_DEFAULT_STATE,
  SETTING_DEFAULT_THEME,
  SETTING_DEFAULT_LANGUAGE,
} from "@/lib/constants";

export function AppSidebar() {
  const { state, open, setOpen } = useSidebar();
  const sidebarDefaultState = useSettingValue<string>(
    SETTING_SIDEBAR_DEFAULT_STATE,
    "open",
  );
  const upsertSettingValue = useUpsertSettingValue();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { theme, setTheme } = useTheme();
  const { data: alertStats } = useAlertStats();
  const { locale, setLocale } = useLocale();
  const { t } = useTranslation("common");
  const { isRTL } = useDirection();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Handle logout with navigation
  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login" });
  };

  // Main menu items
  const mainMenuItems = [
    {
      title: t("navigation.home"),
      url: "/",
      icon: Home,
    },
    {
      title: t("navigation.orders"),
      url: "/special-orders",
      icon: Package,
      badge: true,
    },
    {
      title: t("navigation.suppliers"),
      url: "/suppliers",
      icon: Users,
    },
    {
      title: t("navigation.reports"),
      url: "/reports",
      icon: BarChart3,
    },
  ];

  // Secondary menu items
  const secondaryMenuItems = [
    {
      title: t("navigation.settings"),
      url: "/settings",
      icon: Settings,
    },
    {
      title: t("navigation.help"),
      url: "/help",
      icon: HelpCircle,
    },
  ];

  const totalAlerts =
    (alertStats?.oldOrders || 0) +
    (alertStats?.notPickedUp || 0) +
    (alertStats?.delayed || 0);

  // Load sidebar state from settings on mount only
  useEffect(() => {
    if (sidebarDefaultState) {
      const shouldBeOpen = sidebarDefaultState === "open";
      if (open !== shouldBeOpen) {
        setOpen(shouldBeOpen);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Save sidebar state to settings when it changes (but not on initial load)
  const isInitialMount = useRef(true);
  useEffect(() => {
    // Skip the first render to avoid saving on initial load
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const newState = open ? "open" : "collapsed";
    if (sidebarDefaultState !== newState) {
      const def = getSettingDefinition(SETTING_SIDEBAR_DEFAULT_STATE);
      upsertSettingValue.mutate({
        key: SETTING_SIDEBAR_DEFAULT_STATE,
        value: newState,
        category: def?.category,
      });
    }
  }, [open, sidebarDefaultState, upsertSettingValue]);

  return (
    <Sidebar
      collapsible="icon"
      side={isRTL ? "right" : "left"}
      className={isRTL ? "border-l" : "border-r"}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 py-3">
              <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg shrink-0">
                <Pill className="size-4" />
              </div>
              <div
                className={`grid flex-1 text-sm leading-tight min-w-0 group-data-[collapsible=icon]:hidden ${isRTL ? "text-right" : "text-left"}`}
              >
                <span className="truncate font-bold text-base">
                  {t("app.title")}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {t("app.subtitle")}
                </span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("navigation.mainMenu")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => {
                const isActive = currentPath === item.url;
                const showBadge = item.badge && totalAlerts > 0;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={state === "collapsed" ? item.title : undefined}
                      render={(props) => <Link to={item.url} {...props} />}
                    >
                      <item.icon className="shrink-0 size-4" />
                      <span
                        className={`flex-1 ${isRTL ? "text-right" : "text-left"}`}
                      >
                        {item.title}
                      </span>
                      {showBadge && (
                        <SidebarMenuBadge>{totalAlerts}</SidebarMenuBadge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>{t("navigation.other")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryMenuItems.map((item) => {
                const isActive = currentPath === item.url;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={state === "collapsed" ? item.title : undefined}
                      render={(props) => <Link to={item.url} {...props} />}
                    >
                      <item.icon className="shrink-0 size-4" />
                      <span
                        className={`flex-1 ${isRTL ? "text-right" : "text-left"}`}
                      >
                        {item.title}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>{t("navigation.appearance")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => {
                    // Cycle through: light -> dark -> system -> light
                    let newTheme: "light" | "dark" | "system";
                    if (theme === "light") {
                      newTheme = "dark";
                    } else if (theme === "dark") {
                      newTheme = "system";
                    } else {
                      newTheme = "light";
                    }

                    console.log("🎨 Theme change:", {
                      from: theme,
                      to: newTheme,
                    });

                    // Update theme provider immediately
                    setTheme(newTheme);

                    // Save to database
                    const def = getSettingDefinition(SETTING_DEFAULT_THEME);
                    upsertSettingValue.mutate({
                      key: SETTING_DEFAULT_THEME,
                      value: newTheme,
                      category: def?.category,
                    });
                  }}
                  tooltip={
                    state === "collapsed"
                      ? theme === "light"
                        ? t("theme.dark")
                        : theme === "dark"
                          ? t("theme.system")
                          : t("theme.light")
                      : undefined
                  }
                  className="flex items-center gap-2"
                >
                  {theme === "light" ? (
                    <Moon className="shrink-0 size-4" />
                  ) : theme === "dark" ? (
                    <Settings className="shrink-0 size-4" />
                  ) : (
                    <Sun className="shrink-0 size-4" />
                  )}
                  <span
                    className={`flex-1 ${isRTL ? "text-right" : "text-left"}`}
                  >
                    {theme === "light"
                      ? t("theme.dark")
                      : theme === "dark"
                        ? t("theme.system")
                        : t("theme.light")}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => {
                    const newLocale = locale === "ar" ? "en" : "ar";
                    console.log("🌍 Sidebar language change:", {
                      from: locale,
                      to: newLocale,
                    });
                    setLocale(newLocale);
                    // Save to database
                    console.log("💾 Saving language to database...");
                    const def = getSettingDefinition(SETTING_DEFAULT_LANGUAGE);
                    upsertSettingValue.mutate({
                      key: SETTING_DEFAULT_LANGUAGE,
                      value: newLocale,
                      category: def?.category,
                    });
                  }}
                  tooltip={
                    state === "collapsed"
                      ? LOCALES[locale === "ar" ? "en" : "ar"].nativeName
                      : undefined
                  }
                  className="flex items-center gap-2"
                >
                  <Languages className="shrink-0 size-4" />
                  <span
                    className={`flex-1 ${isRTL ? "text-right" : "text-left"}`}
                  >
                    {LOCALES[locale === "ar" ? "en" : "ar"].nativeName}
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
            <DropdownMenu>
              <DropdownMenuTrigger
                render={(props) => (
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    {...props}
                  />
                )}
              >
                <div className="flex items-center gap-2 w-full">
                  <Avatar className="h-8 w-8 rounded-lg shrink-0">
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                      {user?.first_name?.charAt(0) || "U"}
                      {user?.last_name?.charAt(0) || ""}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`grid flex-1 text-sm leading-tight min-w-0 ${isRTL ? "text-right" : "text-left"}`}
                  >
                    <span className="truncate font-semibold">
                      {user?.display_name ||
                        `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
                        t("user.pharmacy")}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email || t("user.pharmacist")}
                    </span>
                  </div>
                  <ChevronDown
                    className={`shrink-0 size-4 ${isRTL ? "mr-auto" : "ml-auto"}`}
                  />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem className="cursor-pointer flex items-center gap-2">
                  <Settings className="h-4 w-4 shrink-0" />
                  <span>{t("navigation.settings")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer flex items-center gap-2">
                  <Bell className="h-4 w-4 shrink-0" />
                  <span>{t("user.notifications")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 shrink-0" />
                  <span>{t("navigation.help")}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer flex items-center gap-2 text-destructive focus:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>{t("auth.logout")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
