"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { CalendarDays, LayoutDashboard, Settings, LogOut, ExternalLink, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  user: { name?: string | null; email?: string | null; image?: string | null; slug?: string };
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
];

export function DashboardNav({ user }: Props) {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-indigo-600">
            <CalendarDays className="h-5 w-5" />
            <span className="hidden sm:inline">BookEase</span>
          </Link>
          <div className="flex gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition",
                  pathname === href
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user.slug && (
            <Link
              href={`/book/${user.slug}`}
              target="_blank"
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 transition"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">Booking page</span>
            </Link>
          )}
          <div className="flex items-center gap-2">
            {user.image ? (
              <Image src={user.image} alt={user.name || ""} width={28} height={28} className="h-7 w-7 rounded-full" />
            ) : (
              <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">
                {user.name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
              {user.name}
            </span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
