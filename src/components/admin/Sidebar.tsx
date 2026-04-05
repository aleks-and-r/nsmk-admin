"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/players",
    label: "Players",
  },
  {
    href: "/coaches",
    label: "Coaches",
  },
  {
    href: "/clubs",
    label: "Clubs",
  },
  {
    href: "/leagues",
    label: "Leagues",
  },
  {
    href: "/seasons",
    label: "Seasons",
  },
  {
    href: "/matches",
    label: "Matches",
  },
  {
    href: "/venues",
    label: "Venues",
  },
  {
    href: "/gallery",
    label: "Gallery",
  },

  {
    href: "/documents",
    label: "Documents",
  },
];

interface SidebarProps {
  collapsed: boolean;
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside
      className={`flex flex-col h-full bg-sidebar-bg text-white transition-all duration-200 ${
        collapsed ? "w-14" : "w-52"
      }`}
    >
      {/* Branding */}
      <div
        className={`flex items-center h-14 px-4 border-b border-white/10 ${collapsed ? "justify-center" : ""}`}
      >
        {collapsed ? (
          <span className="text-lg font-black">L</span>
        ) : (
          <span className="text-xl font-black tracking-wide">LZR</span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <div
              key={item.href}
              className={`flex items-center group ${
                active
                  ? "border-l-2 border-accent bg-sidebar-active-bg"
                  : "border-l-2 border-transparent"
              }`}
            >
              <Link
                href={item.href}
                className={`flex items-center gap-3 flex-1 px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "text-white"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                } ${collapsed ? "justify-center" : ""}`}
              >
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
