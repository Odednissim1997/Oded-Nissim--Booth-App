'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Building2, Users, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/recruitment', label: 'Recruiting', icon: Building2 },
  { href: '/networking', label: 'Network', icon: Users },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
]

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname()

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <nav className="hidden md:flex flex-col w-56 bg-white border-r border-gray-200 py-6 px-3">
        <div className="px-3 mb-8">
          <h1 className="text-xl font-bold text-blue-700">Booth Recruiting</h1>
          <p className="text-xs text-gray-400 mt-0.5">Strategy Consulting</p>
        </div>
        <div className="flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                path === href
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-gray-200 flex safe-bottom z-50">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
              path === href ? 'text-blue-700' : 'text-gray-400'
            )}
          >
            <Icon size={20} />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
