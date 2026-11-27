import { Building2, CalendarClock, LayoutDashboard, Pill, Stethoscope, Users } from "lucide-react";

export type RouteKey = "/" | "/pessoas" | "/estabelecimentos" | "/agendamentos" | "/consultas" | "/medicamentos";

const items: { title: string; url: RouteKey; icon: typeof LayoutDashboard }[] = [
  { title: "Visão geral", url: "/", icon: LayoutDashboard },
  { title: "Pessoas & Perfis", url: "/pessoas", icon: Users },
  { title: "Estabelecimentos", url: "/estabelecimentos", icon: Building2 },
  { title: "Agendamentos", url: "/agendamentos", icon: CalendarClock },
  { title: "Consultas", url: "/consultas", icon: Stethoscope },
  { title: "Medicamentos", url: "/medicamentos", icon: Pill },
];

type Props = {
  activePath: RouteKey;
  onNavigate: (url: RouteKey) => void;
};

export function AppSidebar({ activePath, onNavigate }: Props) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2.5 border-b border-slate-200 px-4 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-600 font-bold text-white">
          C
        </div>
        <div className="leading-tight">
          <div className="font-semibold text-slate-900">CInfarm</div>
          <div className="text-xs text-slate-500">Farmácia clínica</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        <div className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Gestão
        </div>
        {items.map((i) => {
          const active = activePath === i.url;
          return (
            <button
              key={i.url}
              type="button"
              onClick={() => onNavigate(i.url)}
              className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                active
                  ? "bg-teal-50 text-teal-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <i.icon className="h-4 w-4 shrink-0" />
              <span>{i.title}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}