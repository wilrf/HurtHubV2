import {
  Menu,
  X,
  Home,
  Users,
  BarChart3,
  MessageSquare,
  Settings,
  Bell,
  Search,
} from "lucide-react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, Outlet } from "react-router-dom";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { VersionDisplay } from "@/components/ui/VersionDisplay";
// Dark mode only - no theme switching
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/utils";

import type { RootState } from "@/store";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Community Pulse", href: "/community", icon: Users },
  {
    name: "Business Intelligence",
    href: "/business-intelligence",
    icon: BarChart3,
  },
  { name: "AI Assistant", href: "/ai-assistant", icon: MessageSquare },
];

export function MainLayout() {
  const location = useLocation();
  const { user } = useAuth();
  // Dark mode only
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const notifications = useSelector(
    (state: RootState) => state.ui.notifications,
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen transition-all duration-300 bg-midnight-950">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-backdrop backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "glass-dark border-gray-800/50",
          "border-r shadow-sleek-lg",
        )}
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg",
                "bg-sapphire-800/50 backdrop-blur-sm",
              )}
            >
              <BarChart3 className={cn("h-5 w-5", "text-white")} />
            </div>
            <h1 className="text-lg font-semibold text-white">
              Charlotte EconDev
            </h1>
          </div>

          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden micro-hover border border-transparent hover:border-border/50"
          >
            <X className="h-4 w-4 icon-bounce" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;

            return (
              <a
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 relative overflow-hidden",
                  isActive
                    ? "glass text-white shadow-md shadow-sapphire-500/10 bg-sapphire-900/30"
                    : "text-gray-400 hover:bg-sapphire-900/20 hover:text-white hover:translate-x-1",
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <div
                  className={cn(
                    "absolute left-0 top-0 h-full w-1 transition-all duration-200",
                    isActive
                      ? "bg-sapphire-400"
                      : "bg-transparent group-hover:bg-sapphire-600",
                  )}
                />
                <Icon
                  className={cn(
                    "h-5 w-5 transition-all duration-200",
                    isActive
                      ? "text-sapphire-300"
                      : "group-hover:scale-110 group-hover:text-sapphire-400",
                  )}
                />
                <span className="relative">
                  {item.name}
                  {isActive && (
                    <div className="absolute -bottom-0.5 left-0 right-0 h-1 bg-gradient-to-r from-sapphire-400 to-transparent" />
                  )}
                </span>
              </a>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-gray-800/50 p-4">
          {user && (
            <div
              className={cn(
                "flex items-center space-x-3 rounded-xl p-3",
                "glass",
              )}
            >
              <Avatar
                src={user.avatar}
                initials={`${user.firstName[0]}${user.lastName[0]}`}
                size="sm"
                variant="midnight"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-white">
                  {user.firstName} {user.lastName}
                </p>
                <p className={cn("text-xs truncate", "text-gray-400")}>
                  {user.email}
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header
          className={cn(
            "sticky top-0 z-30 h-16 border-b transition-all duration-300",
            "glass-dark backdrop-blur-xl border-gray-800/50",
            "shadow-sleek",
          )}
        >
          <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden micro-hover border border-transparent hover:border-border/50"
            >
              <Menu className="h-5 w-5 icon-bounce" />
            </Button>

            {/* Search bar */}
            <div className="flex-1 max-w-md mx-4">
              <Input
                type="search"
                placeholder="Search companies, news, developments..."
                variant="midnight"
                leftIcon={<Search className="h-4 w-4" />}
                className="w-full"
              />
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-3">
              {/* Version Display */}
              <VersionDisplay />

              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="relative micro-hover border border-transparent hover:border-primary/20"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5 icon-bounce" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs badge-interactive"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </Button>

              {/* Settings */}
              <Button
                variant="ghost"
                size="icon"
                aria-label="Settings"
                className="relative micro-hover border border-transparent hover:border-primary/20"
              >
                <Settings className="h-5 w-5 icon-bounce" />
              </Button>

              {/* User menu */}
              {user && (
                <Avatar
                  src={user.avatar}
                  initials={`${user.firstName[0]}${user.lastName[0]}`}
                  variant="midnight"
                  className="cursor-pointer hover:ring-2 hover:ring-ring transition-all duration-200 hover:border-primary/20"
                />
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          <div className="h-[calc(100vh-4rem)] overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
