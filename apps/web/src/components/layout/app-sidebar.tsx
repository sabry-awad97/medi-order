import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useMemo, useCallback, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Home,
  Package,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Pill,
  Bell,
  Moon,
  Sun,
  Languages,
  LogOut,
  PackageSearch,
  FileText,
  TrendingUp,
  Tablets,
  ClipboardList,
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "@/components/settings";
import { useAlertStats, useSettingValue, useUpsertSettingValue } from "@/hooks";
import {
  useLocale,
  LOCALES,
  useTranslation,
  useDirection,
} from "@meditrack/i18n";
import { useAuth } from "@/hooks/use-auth";
import { getSettingDefinition, type SettingKey } from "@/lib/constants";
import {
  SETTING_SIDEBAR_DEFAULT_STATE,
  SETTING_DEFAULT_THEME,
  SETTING_DEFAULT_LANGUAGE,
} from "@/lib/constants";
import { useInventoryStatistics } from "@/hooks/use-inventory";
import {
  useSidebarStore,
  selectToggleExpanded,
  createIsExpandedSelector,
} from "@/stores/sidebar-store";

// ============================================================================
// Constants
// ============================================================================

const BADGE_EMPTY: BadgeConfig = { value: 0, show: false };

const MOTION_CHEVRON = {
  duration: 0.2,
  ease: "easeInOut" as const,
};

const MOTION_SUBMENU = {
  duration: 0.2,
  ease: "easeInOut" as const,
};

const MOTION_SUBITEM = {
  duration: 0.15,
  ease: "easeOut" as const,
};

// ============================================================================
// Types
// ============================================================================

interface MenuItem {
  title: string;
  url?: string; // Optional - parent items with subItems don't need a URL
  icon: React.ComponentType<{ className?: string }>;
  badge?: "orders" | "inventory";
  subItems?: SubMenuItem[];
}

interface SubMenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface BadgeConfig {
  value: number;
  show: boolean;
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Custom hook to sync expanded menu items with current route
 * Auto-expands parent menu when a subitem is active
 * Only expands items that aren't already expanded to avoid re-triggering animations
 */
function useSyncExpandedWithRoute(currentPath: string, menuItems: MenuItem[]) {
  useEffect(() => {
    // Get current state directly to avoid dependency on expandedItems
    const { expandedItems, expandItem } = useSidebarStore.getState();

    menuItems.forEach((item) => {
      if (item.subItems) {
        const hasActiveSubItem = item.subItems.some(
          (subItem) =>
            currentPath === subItem.url ||
            currentPath.startsWith(subItem.url + "/"),
        );
        // Only expand if it has an active sub-item AND is not already expanded
        if (hasActiveSubItem && !expandedItems.has(item.title)) {
          expandItem(item.title);
        }
      }
    });
  }, [currentPath, menuItems]);
}

/**
 * Custom hook to manage all menu items configuration
 */
function useMenuItems(t: (key: string) => string) {
  return useMemo(
    () => ({
      main: [
        {
          title: t("navigation.home"),
          url: "/",
          icon: Home,
        },
        {
          title: t("navigation.inventory"),
          icon: PackageSearch,
          badge: "inventory" as const,
          subItems: [
            {
              title: t("navigation.allItems"),
              url: "/inventory/items",
              icon: PackageSearch,
            },
            {
              title: t("navigation.manufacturers"),
              url: "/inventory/manufacturers",
              icon: Users,
            },
            {
              title: t("navigation.medicineForms"),
              url: "/inventory/medicine-forms",
              icon: Tablets,
            },
            {
              title: t("navigation.openingBalances"),
              url: "/inventory/opening-balances",
              icon: ClipboardList,
            },
            {
              title: t("navigation.stockAdjustments"),
              url: "/inventory/stock-adjustments",
              icon: TrendingUp,
            },
            {
              title: t("navigation.itemInquiry"),
              url: "/inventory/item-inquiry",
              icon: FileText,
            },
          ],
        },
        {
          title: t("navigation.orders"),
          url: "/special-orders",
          icon: Package,
          badge: "orders" as const,
        },
        {
          title: t("navigation.suppliers"),
          url: "/suppliers",
          icon: Users,
        },
        {
          title: t("navigation.reports"),
          icon: BarChart3,
          subItems: [
            {
              title: t("navigation.salesReports"),
              url: "/reports/sales",
              icon: TrendingUp,
            },
            {
              title: t("navigation.inventoryReports"),
              url: "/reports/inventory",
              icon: FileText,
            },
          ],
        },
      ] as MenuItem[],
      secondary: [
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
      ] as MenuItem[],
    }),
    [t],
  );
}

/**
 * Custom hook to manage sidebar persistence
 */
function useSidebarPersistence(
  open: boolean,
  setOpen: (open: boolean) => void,
  sidebarDefaultState: string | undefined,
  upsertSettingValue: ReturnType<typeof useUpsertSettingValue>,
) {
  const isInitialMount = useRef(true);

  // Load sidebar state from settings on mount
  useEffect(() => {
    if (sidebarDefaultState && open !== (sidebarDefaultState === "open")) {
      setOpen(sidebarDefaultState === "open");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save sidebar state to settings when it changes
  useEffect(() => {
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
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a menu item is active based on current path
 */
function isMenuItemActive(
  itemUrl: string | undefined,
  currentPath: string,
  isSubItem = false,
): boolean {
  if (!itemUrl) return false;
  return isSubItem
    ? currentPath === itemUrl
    : currentPath === itemUrl || currentPath.startsWith(`${itemUrl}/`);
}

/**
 * Calculate badge configuration for a menu item
 */
function getBadgeConfig(
  badge: MenuItem["badge"],
  totalAlerts: number,
  totalInventoryItems: number,
): BadgeConfig {
  if (!badge) return BADGE_EMPTY;
  if (badge === "orders" && totalAlerts > 0) {
    return { value: totalAlerts, show: true };
  }
  if (badge === "inventory" && totalInventoryItems > 0) {
    return { value: totalInventoryItems, show: true };
  }
  return BADGE_EMPTY;
}

// ============================================================================
// Sub-Components
// ============================================================================

interface MenuItemProps {
  item: MenuItem;
  currentPath: string;
  sidebarState: "expanded" | "collapsed";
  isRTL: boolean;
  totalAlerts: number;
  totalInventoryItems: number;
}

const CollapsibleMenuItem = memo(function CollapsibleMenuItem({
  item,
  currentPath,
  sidebarState,
  isRTL,
  totalAlerts,
  totalInventoryItems,
}: MenuItemProps) {
  const isExpanded = useSidebarStore(createIsExpandedSelector(item.title));
  const toggleExpanded = useSidebarStore(selectToggleExpanded);

  const handleToggle = useCallback(() => {
    toggleExpanded(item.title);
  }, [toggleExpanded, item.title]);

  const isActive = isMenuItemActive(item.url, currentPath);
  const badgeConfig = getBadgeConfig(
    item.badge,
    totalAlerts,
    totalInventoryItems,
  );
  const badgeClassName = isRTL ? "left-6 right-auto" : "right-6 left-auto";
  const textAlign = isRTL ? "text-right" : "text-left";

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={handleToggle}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger
          render={(props) => (
            <SidebarMenuButton
              isActive={isActive}
              tooltip={sidebarState === "collapsed" ? item.title : undefined}
              className="w-full"
              {...props}
            >
              <item.icon className="shrink-0 size-4" />
              <span className={`flex-1 ${textAlign}`}>{item.title}</span>
              <motion.div
                initial={false}
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={MOTION_CHEVRON}
                className={`shrink-0 ${isRTL ? "rotate-180" : ""}`}
              >
                <ChevronRight className="size-4" />
              </motion.div>
            </SidebarMenuButton>
          )}
        />
        {badgeConfig.show && (
          <SidebarMenuBadge className={badgeClassName}>
            {badgeConfig.value}
          </SidebarMenuBadge>
        )}
        <CollapsibleContent>
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={MOTION_SUBMENU}
                style={{ overflow: "hidden" }}
              >
                <SidebarMenuSub>
                  {item.subItems?.map((subItem, index) => (
                    <motion.div
                      key={subItem.title}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{
                        ...MOTION_SUBITEM,
                        delay: index * 0.05,
                      }}
                    >
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          isActive={isMenuItemActive(
                            subItem.url,
                            currentPath,
                            true,
                          )}
                          render={(props) => (
                            <Link to={subItem.url} {...props} />
                          )}
                        >
                          <subItem.icon className="shrink-0 size-4" />
                          <span className={`flex-1 ${textAlign}`}>
                            {subItem.title}
                          </span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </motion.div>
                  ))}
                </SidebarMenuSub>
              </motion.div>
            )}
          </AnimatePresence>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
});

const SimpleMenuItem = memo(function SimpleMenuItem({
  item,
  currentPath,
  sidebarState,
  isRTL,
  totalAlerts,
  totalInventoryItems,
}: MenuItemProps) {
  const isActive = isMenuItemActive(item.url, currentPath);
  const badgeConfig = getBadgeConfig(
    item.badge,
    totalAlerts,
    totalInventoryItems,
  );
  const badgeClassName = isRTL ? "left-1 right-auto" : "right-1 left-auto";
  const textAlign = isRTL ? "text-right" : "text-left";

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        tooltip={sidebarState === "collapsed" ? item.title : undefined}
        render={(props) =>
          item.url ? <Link to={item.url} {...props} /> : <div {...props} />
        }
      >
        <item.icon className="shrink-0 size-4" />
        <span className={`flex-1 ${textAlign}`}>{item.title}</span>
      </SidebarMenuButton>
      {badgeConfig.show && (
        <SidebarMenuBadge className={badgeClassName}>
          {badgeConfig.value}
        </SidebarMenuBadge>
      )}
    </SidebarMenuItem>
  );
});

// ============================================================================
// Menu Rendering Helper
// ============================================================================

interface MenuGroupProps {
  items: MenuItem[];
  currentPath: string;
  sidebarState: "expanded" | "collapsed";
  isRTL: boolean;
  totalAlerts: number;
  totalInventoryItems: number;
}

const MenuGroup = memo(function MenuGroup({
  items,
  currentPath,
  sidebarState,
  isRTL,
  totalAlerts,
  totalInventoryItems,
}: MenuGroupProps) {
  return (
    <>
      {items.map((item) => {
        const hasSubItems = item.subItems && item.subItems.length > 0;
        const Component = hasSubItems ? CollapsibleMenuItem : SimpleMenuItem;

        return (
          <Component
            key={item.title}
            item={item}
            currentPath={currentPath}
            sidebarState={sidebarState}
            isRTL={isRTL}
            totalAlerts={totalAlerts}
            totalInventoryItems={totalInventoryItems}
          />
        );
      })}
    </>
  );
});

// ============================================================================
// Main Component
// ============================================================================

export function AppSidebar() {
  const { state, open, setOpen } = useSidebar();
  const sidebarDefaultState = useSettingValue<string>(
    SETTING_SIDEBAR_DEFAULT_STATE,
    "open",
  );
  const currentPath = useRouterState().location.pathname;
  const { theme, setTheme } = useTheme();
  const { data: alertStats } = useAlertStats();
  const { data: inventoryStats } = useInventoryStatistics();
  const { locale, setLocale } = useLocale();
  const { t } = useTranslation("common");
  const { isRTL } = useDirection();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const upsertSettingValue = useUpsertSettingValue();

  // Menu configuration
  const menuItems = useMenuItems(t);

  // Calculate badge values
  const totalAlerts = useMemo(
    () =>
      (alertStats?.oldOrders || 0) +
      (alertStats?.notPickedUp || 0) +
      (alertStats?.delayed || 0),
    [alertStats],
  );
  const totalInventoryItems = inventoryStats?.active_items || 0;

  // Sync expanded items with current route
  useSyncExpandedWithRoute(currentPath, menuItems.main);

  // Sidebar persistence
  useSidebarPersistence(open, setOpen, sidebarDefaultState, upsertSettingValue);

  // Event handlers
  const handleLogout = useCallback(async () => {
    await logout();
    navigate({ to: "/login" });
  }, [logout, navigate]);

  const handleSettingChange = useCallback(
    (key: SettingKey, value: string) => {
      const def = getSettingDefinition(key);
      upsertSettingValue.mutate({ key, value, category: def?.category });
    },
    [upsertSettingValue],
  );

  const handleThemeChange = useCallback(() => {
    const newTheme: "light" | "dark" | "system" =
      theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(newTheme);
    handleSettingChange(SETTING_DEFAULT_THEME, newTheme);
  }, [theme, setTheme, handleSettingChange]);

  const handleLanguageChange = useCallback(() => {
    const newLocale = locale === "ar" ? "en" : "ar";
    setLocale(newLocale);
    handleSettingChange(SETTING_DEFAULT_LANGUAGE, newLocale);
  }, [locale, setLocale, handleSettingChange]);

  const themeLabel =
    theme === "light"
      ? t("theme.dark")
      : theme === "dark"
        ? t("theme.system")
        : t("theme.light");
  const ThemeIcon =
    theme === "light" ? Moon : theme === "dark" ? Settings : Sun;
  const languageLabel = LOCALES[locale === "ar" ? "en" : "ar"].nativeName;
  const textAlign = isRTL ? "text-right" : "text-left";
  const sidebarSide = isRTL ? "right" : "left";
  const sidebarBorder = isRTL ? "border-l" : "border-r";

  return (
    <Sidebar collapsible="icon" side={sidebarSide} className={sidebarBorder}>
      {/* Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 py-3">
              <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg shrink-0">
                <Pill className="size-4" />
              </div>
              <div
                className={`grid flex-1 text-sm leading-tight min-w-0 group-data-[collapsible=icon]:hidden ${textAlign}`}
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

      {/* Content */}
      <SidebarContent>
        {/* Main Menu */}
        <SidebarGroup>
          <SidebarGroupLabel>{t("navigation.mainMenu")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <MenuGroup
                items={menuItems.main}
                currentPath={currentPath}
                sidebarState={state}
                isRTL={isRTL}
                totalAlerts={totalAlerts}
                totalInventoryItems={totalInventoryItems}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Secondary Menu */}
        <SidebarGroup>
          <SidebarGroupLabel>{t("navigation.other")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <MenuGroup
                items={menuItems.secondary}
                currentPath={currentPath}
                sidebarState={state}
                isRTL={isRTL}
                totalAlerts={0}
                totalInventoryItems={0}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Appearance Settings */}
        <SidebarGroup>
          <SidebarGroupLabel>{t("navigation.appearance")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleThemeChange}
                  tooltip={state === "collapsed" ? themeLabel : undefined}
                >
                  <ThemeIcon className="shrink-0 size-4" />
                  <span className={`flex-1 ${textAlign}`}>{themeLabel}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLanguageChange}
                  tooltip={state === "collapsed" ? languageLabel : undefined}
                >
                  <Languages className="shrink-0 size-4" />
                  <span className={`flex-1 ${textAlign}`}>{languageLabel}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
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
                    className={`grid flex-1 text-sm leading-tight min-w-0 ${textAlign}`}
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
