'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Logo from '@/components/ui/Logo'

const LINKS = [
  { href: '/dashboard', label: 'Studio' },
  { href: '/session', label: 'This week' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/insights', label: 'Insights' },
  { href: '/settings', label: 'Settings' },
]

export default function AppHeader() {
  const pathname = usePathname()
  return (
    <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur border-b-2 border-ink">
      <div className="mx-auto max-w-6xl flex items-center justify-between gap-4 px-4 sm:px-6 h-16">
        <Logo href="/dashboard" />
        <form action="/api/auth/signout" method="post" className="md:order-last">
          <button className="text-sm font-medium text-ink-soft hover:text-terracotta transition">Sign out</button>
        </form>
        <nav className="hidden md:flex items-center gap-1" aria-label="Main">
          {LINKS.map((link) => (
            <NavLink key={link.href} {...link} active={pathname === link.href} />
          ))}
        </nav>
      </div>
      <nav className="md:hidden flex gap-1 overflow-x-auto px-4 pb-3 -mt-1" aria-label="Main">
        {LINKS.map((link) => (
          <NavLink key={link.href} {...link} active={pathname === link.href} />
        ))}
      </nav>
    </header>
  )
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`shrink-0 h-9 px-3.5 inline-flex items-center text-sm font-semibold border-2 cut-sm transition ${
        active ? 'bg-ochre border-ink shadow-ink-sm' : 'border-transparent text-ink-soft hover:border-ink hover:bg-surface'
      }`}
    >
      {label}
    </Link>
  )
}
