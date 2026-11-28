import { useQuery } from "@tanstack/react-query";
import { CalendarClock, ClipboardCheck, Pill, Users } from "lucide-react";
import { api, paths, type Row } from "../api/pessoas";
import { StatusBadge } from "../components/ResourceManager";

const useList = (p: string) =>
  useQuery({ queryKey: ["res", p], queryFn: () => api.list(p) }).data ?? [];

const fmtDataHora = (v: unknown) => {
  const dt = new Date(String(v));
  return isNaN(+dt) ? "—" : dt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
};

export function VisaoGeral() {
  const pessoas = useList(paths.pacientes);
  const ags = useList(paths.agendamentos);
  const consultas = useList(paths.consultas);
  const meds = useList(paths.medicamentos);

  const pacientes = pessoas.filter((p) => p["perfil"] === "paciente");

  const todayKey = new Date().toLocaleDateString("sv-SE");
  const hoje = ags.filter((a) => String(a["data_hora_prevista"] ?? "").slice(0, 10) === todayKey);

  const nome = (a: Row, campo: "paciente" | "profissional_saude") => {
    if (a[campo]) return String(a[campo]);
    const cpf = a[`${campo}_cpf`];
    const p = pessoas.find((x) => x["cpf"] === cpf);
    return String(p?.["name"] ?? cpf ?? "—");
  };

  const inicioDoDia = new Date(new Date().setHours(0, 0, 0, 0));
  const proximos = ags
    .filter((a) => new Date(String(a["data_hora_prevista"])) >= inicioDoDia && a["status"] !== "Cancelado")
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
      <div className="stats-grid">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="stat-card">
            <div className="stat-top">
              <span className="stat-label">{label}</span>
              <span className="stat-icon">
                <Icon size={18} aria-hidden />
              </span>
            </div>
            <div className="stat-value">{value}</div>
          </div>
        ))}
      </div>

      <div className="list-card">
        <div className="list-header">
          <h2>Próximos agendamentos</h2>
        </div>

        {proximos.length === 0 ? (
          <div className="list-state">
            <p>Nenhum agendamento próximo</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Data/hora</th>
                  <th>Paciente</th>
                  <th>Profissional</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {proximos.map((a) => (
                  <tr key={String(a["agendamento_id"])}>
                    <td>{fmtDataHora(a["data_hora_prevista"])}</td>
                    <td>{nome(a, "paciente")}</td>
                    <td>{nome(a, "profissional_saude")}</td>
                    <td>
                      <StatusBadge value={String(a["status"] ?? "")} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}