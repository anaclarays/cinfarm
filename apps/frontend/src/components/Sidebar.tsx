import {
  Building2,
  CalendarDays,
  CalendarPlus,
  ChevronDown,
  ClipboardList,
  HeartPulse,
  Pill,
  Stethoscope,
  UsersRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getPage, pages } from '../navigation'
import type { Page } from '../navigation'

const primaryLinks = [
  { page: 'agenda', icon: CalendarDays },
  { page: 'realizar-agendamento', icon: CalendarPlus },
  { page: 'pacientes', icon: UsersRound },
  { page: 'profissionais', icon: Stethoscope },
] satisfies NavItem[]

const operationalLinks = [
  { page: 'medicamentos', icon: Pill },
  { page: 'estabelecimentos', icon: Building2 },
] satisfies NavItem[]

type NavItem = { page: Page; icon: LucideIcon }

function isOperational(page: Page) {
  return operationalLinks.some((item) => item.page === page)
}

function NavLink({ item, active }: { item: NavItem; active: Page }) {
  const { page, icon: Icon } = item
  return (
    <a
      className="nav-link"
      href={`#${page}`}
      aria-current={active === page ? 'page' : undefined}
    >
      <Icon size={19} aria-hidden="true" />
      {pages[page].title}
    </a>
  )
}

export function Sidebar({ page }: { page: Page }) {
  const [expanded, setExpanded] = useState(() => isOperational(page))

  useEffect(() => {
    const showActiveSubmenu = () => {
      if (isOperational(getPage())) setExpanded(true)
    }
    window.addEventListener('hashchange', showActiveSubmenu)
    return () => window.removeEventListener('hashchange', showActiveSubmenu)
  }, [])

  return (
    <aside className="sidebar">
      <a className="brand" href="#agenda">
        <span className="brand-icon">
          <HeartPulse size={22} aria-hidden="true" />
        </span>
        CinFarm
      </a>
      <nav aria-label="Navegação principal">
        {primaryLinks.map((item) => (
          <NavLink key={item.page} item={item} active={page} />
        ))}
        <button
          className="nav-link nav-toggle"
          type="button"
          aria-expanded={expanded}
          aria-controls="operacional-links"
          onClick={() => setExpanded((open) => !open)}
        >
          <ClipboardList size={19} aria-hidden="true" />
          Operacional
          <ChevronDown className="nav-chevron" size={15} aria-hidden="true" />
        </button>
        <div className="nav-children" id="operacional-links" hidden={!expanded}>
          {operationalLinks.map((item) => (
            <NavLink key={item.page} item={item} active={page} />
          ))}
        </div>
      </nav>
    </aside>
  )
}
