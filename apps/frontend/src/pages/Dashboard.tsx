import { useQuery } from "@tanstack/react-query";
import { CalendarClock, ClipboardCheck, Pill, Users } from "lucide-react";
import { api, paths, type Row } from "../services/api";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/ResourceManager";

const useList = (p: string) => useQuery({ queryKey: ["res", p], queryFn: () => api.list(p) }).data ?? [];

export function Dashboard() {
  const pacientes = useList(paths.pacientes);
  const profs = useList(paths.profissionais);
  const ags = useList(paths.agendamentos);
  const consultas = useList(paths.consultas);
  const meds = useList(paths.medicamentos);
  const todayKey = new Date().toLocaleDateString("sv-SE");
  const hoje = ags.filter((a) => String(a["data_hora_prevista"] ?? "").slice(0, 10) === todayKey);
  const nome = (list: Row[], cpf: unknown) => String(list.find((p) => p["cpf"] === cpf)?.["nome_completo"] ?? cpf ?? "—");
  const proximos = ags
    .filter((a) => new Date(String(a["data_hora_prevista"])) >= new Date(new Date().setHours(0, 0, 0, 0)) && a["status"] !== "Cancelado")
    .sort((a, b) => String(a["data_hora_prevista"]).localeCompare(String(b["data_hora_prevista"])))
    .slice(0, 8);
  const cards = [
    { label: "Total de pacientes", value: pacientes.length, icon: Users },
    { label: "Agendamentos do dia", value: hoje.length, icon: CalendarClock },
    { label: "Consultas realizadas", value: consultas.length, icon: ClipboardCheck },
    { label: "Medicamentos cadastrados", value: meds.length, icon: Pill },
  ];

  return (
    <div>
      <PageHeader title="Visão geral" description="Acompanhe os principais números da farmácia clínica." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{c.label}</span>
              <span className="rounded-lg bg-teal-50 p-2 text-teal-700">
                <c.icon className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-900">{c.value}</div>
          </div>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold text-slate-900">Próximos agendamentos</h2>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-600">
              <th className="px-4 py-3">Data/hora</th>
              <th className="px-4 py-3">Paciente</th>
              <th className="px-4 py-3">Profissional</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {proximos.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">
                  Nenhum agendamento próximo
                </td>
              </tr>
            ) : (
              proximos.map((a) => (
                <tr key={String(a["agendamento_id"])} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">
                    {new Date(String(a["data_hora_prevista"])).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{nome(pacientes, a["paciente_cpf"])}</td>
                  <td className="px-4 py-3 text-slate-700">{nome(profs, a["profissional_saude_cpf"])}</td>
                  <td className="px-4 py-3">
                    <StatusBadge value={String(a["status"] ?? "")} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}