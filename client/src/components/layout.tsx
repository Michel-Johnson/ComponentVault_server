import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Bell, Microchip, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LanguageSwitcher from "@/components/language-switcher";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/providers/auth-provider";

interface LayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: LayoutProps) {
  const [location, navigate] = useLocation();
  const t = useTranslation();
  const { user, logout } = useAuth();

  const { data: lowStockComponents = [] } = useQuery({
    queryKey: ["/api/components/alerts/low-stock"],
    queryFn: async () => {
      const response = await fetch("/api/components/alerts/low-stock", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch low stock components");
      return response.json();
    },
  });

  const navItems = useMemo(() => {
    const base = [
      { label: t("navInventory"), path: "/inventory", testId: "nav-inventory" },
      { label: t("navReports"), path: "/reports", testId: "nav-reports" },
      { label: t("navSettings"), path: "/settings", testId: "nav-settings" },
    ];
    if (user?.role === "admin") {
      return [...base, { label: t("adminPanel"), path: "/admin", testId: "nav-admin" }];
    }
    return base;
  }, [t, user?.role]);

  const isActive = (path: string) => {
    if (path === "/inventory" && location === "/") return true;
    return location.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Microchip className="text-primary-foreground text-sm" />
                </div>
                <h1 className="text-xl font-bold text-foreground">{t("appName")}</h1>
              </div>
              <nav className="hidden md:flex space-x-1">
                {navItems.map((item) => (
                  <Button
                    key={item.path}
                    variant={isActive(item.path) ? "default" : "ghost"}
                    size="sm"
                    className={isActive(item.path) ? "" : "text-muted-foreground hover:text-foreground"}
                    data-testid={item.testId}
                    onClick={() => navigate(item.path)}
                  >
                    {item.label}
                  </Button>
                ))}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative hidden md:inline-flex" aria-label={t("navNotifications")}>
                    <Bell className="text-muted-foreground h-5 w-5" />
                    {lowStockComponents.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72" align="end">
                  <p className="text-sm font-semibold mb-2">{t("navNotifications")}</p>
                  {lowStockComponents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("notificationEmpty")}</p>
                  ) : (
                    <div className="space-y-2">
                      {lowStockComponents.map((component: any) => (
                        <div key={component.id} className="rounded-md border border-border p-2">
                          <p className="text-sm font-medium">{component.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {t("notificationLowStockItem", { name: component.name })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </PopoverContent>
              </Popover>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="rounded-full" data-testid="user-menu">
                    <User className="text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-sm">
                    {t("userGreeting", { username: user?.username ?? t("navUser") })}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/settings")}>{t("userMenuProfile")}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    {t("userMenuLogout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}

