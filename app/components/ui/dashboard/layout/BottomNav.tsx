"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  HomeIcon,
  BanknotesIcon,
  ShoppingBagIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  BanknotesIcon as BanknotesIconSolid,
  ShoppingBagIcon as ShoppingBagIconSolid,
  ArrowTrendingUpIcon as ArrowTrendingUpIconSolid,
} from "@heroicons/react/24/solid";

const NAV_ITEMS = [
  {
    label: "Cockpit",
    href: "/dashboard",
    icon: HomeIcon,
    iconActive: HomeIconSolid,
    exact: true,
  },
  {
    label: "Sales",
    href: "/dashboard/sales",
    icon: BanknotesIcon,
    iconActive: BanknotesIconSolid,
    exact: false,
  },
  {
    label: "Products",
    href: "/dashboard/products",
    icon: ShoppingBagIcon,
    iconActive: ShoppingBagIconSolid,
    exact: false,
  },
  {
    label: "Forecast",
    href: "/dashboard/forecast",
    icon: ArrowTrendingUpIcon,
    iconActive: ArrowTrendingUpIconSolid,
    exact: false,
  },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-primary-dark border-t border-white/10 flex items-center justify-around px-2 safe-area-pb">
      {NAV_ITEMS.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        const Icon = isActive ? item.iconActive : item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150",
              isActive ? "text-white" : "text-white/40"
            )}
          >
            <Icon className="size-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
