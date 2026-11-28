import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ClipboardList,
  GraduationCap,
  HeartPulse,
  ShieldAlert,
  Stethoscope,
  Users,
  type LucideIcon,
} from "lucide-react";
import { api, flattenPessoa, paths, toPessoaPayload, type Row } from "../api/pessoas";
import { DetailGrid, ResourceManager } from "../components/ResourceManager";
import { estagiarioFields, pacienteFields, profissionalFields } from "../components/fields";

type TabItem<T extends string> = { id: T; label: string; icon: LucideIcon };

type TabsProps<T extends string> = {
  tabs: TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
  size?: "sm" | "md";
};

function Tabs<T extends string>({ tabs, active, onChange, size = "md" }: TabsProps<T>) {
  return (
    <div className={size === "sm" ? "tabs tabs-sm" : "tabs"} role="tablist">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={active === id}
          className="tab"
          onClick={() => onChange(id)}
        >
          <Icon size={16} aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}

type AbaProntuario = "condicoes" | "reacoes";

const abasProntuario: TabItem<AbaProntuario>[] = [
  { id: "condicoes", label: "Condições de saúde", icon: HeartPulse },
  { id: "reacoes", label: "Reações alérgicas", icon: ShieldAlert },
];

type AbaPessoas = "pacientes" | "profissionais" | "estagiarios";

const abasPessoas: TabItem<AbaPessoas>[] = [
  { id: "pacientes", label: "Pacientes", icon: Users },
  { id: "profissionais", label: "Profissionais de saúde", icon: Stethoscope },
  { id: "estagiarios", label: "Estagiários", icon: GraduationCap },
];

const fmtData = (v: unknown) =>
  v ? String(v).slice(0, 10).split("-").reverse().join("/") : "—";

function MiniTable({ headers, rows, empty }: { headers: string[]; rows: ReactNodeRow[]; empty: string }) {
  if (rows.length === 0) {
    return (
      <div className="list-state">
        <p>{empty}</p>
      </div>
    );
  }
  return (
    <div className="list-card">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((cells, i) => (
              <tr key={i}>
                {cells.map((c, j) => (
                  <td key={j}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
type ReactNodeRow = (string | number)[];

const carregarPaciente = async (r: Row) => flattenPessoa(await api.get(paths.pacientes, "cpf", r["cpf"]));

function Prontuario({ row }: { row: Row }) {
  const [aba, setAba] = useState<AbaProntuario>("condicoes");
  const cpf = String(row["cpf"] ?? "");

  const { data: detalhe, isLoading, error } = useQuery({
    queryKey: ["res", paths.pacientes, cpf],
    queryFn: () => api.get(paths.pacientes, "cpf", cpf),
  });
  const { data: medicamentos = [] } = useQuery({
    queryKey: ["res", paths.medicamentos],
    queryFn: () => api.list(paths.medicamentos),
  });

  const flat = flattenPessoa(detalhe ?? row);
  const paciente = (detalhe?.["paciente"] ?? {}) as Row;
  const condicoes = (paciente["condicoes_saude"] ?? []) as Row[];
  const reacoes = (paciente["reacoes_alergicas"] ?? []) as Row[];
  const nomeMed = (id: unknown) =>
    String(medicamentos.find((m) => String(m["medicamento_id"]) === String(id))?.["nome_medicamento"] ?? id ?? "—");

  return (
    <div className="prontuario">
      <div className="prontuario-header">
        <ClipboardList size={24} aria-hidden />
        <div>
          <h3>Prontuário · {String(row["name"] ?? "")}</h3>
          <p>CPF {cpf}</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          Não foi possível carregar o prontuário: {(error as Error).message}
        </div>
      )}

      <DetailGrid row={flat} fields={pacienteFields} />

      <div className="prontuario-tabs">
        <Tabs tabs={abasProntuario} active={aba} onChange={setAba} size="sm" />

        {isLoading ? (
          <div className="list-state" role="status">
            <p>Carregando...</p>
          </div>
        ) : aba === "condicoes" ? (
          <MiniTable
            headers={["Condição", "Tipo", "Início"]}
            rows={condicoes.map((c) => [String(c["nome"] ?? "—"), String(c["tipo"] ?? "—"), fmtData(c["data_inicio"])])}
            empty="Nenhuma condição registrada"
          />
        ) : (
          <MiniTable
            headers={["Medicamento", "Descrição", "Ocorrência"]}
            rows={reacoes.map((r) => [nomeMed(r["medicamento_id"]), String(r["descricao"] ?? "—"), fmtData(r["data_ocorrencia"])])}
            empty="Nenhuma reação alérgica registrada"
          />
        )}
      </div>
    </div>
  );
}

export function Pessoas() {

  const [abaAtiva, setAbaAtiva] =
    useState<AbaPessoas>("pacientes");

  return (
    <div>
      <Tabs tabs={abasPessoas} active={abaAtiva} onChange={setAbaAtiva} />

      {abaAtiva === "pacientes" && (
        <ResourceManager
          title="Pacientes"
          singular="Paciente"
          path={paths.pacientes}
          rowFilter={(r) => r["perfil"] === "paciente"}
          toPayload={toPessoaPayload("paciente")}
          loadItem={carregarPaciente}
          idField="cpf"
          autoId={false}
          fields={pacienteFields}
          columns={["cpf", "name", "telephone"]}
          detail={(r) => <Prontuario row={r} />}
        />
      )}

      {abaAtiva === "profissionais" && (
        <ResourceManager
          title="Profissionais de saúde"
          singular="Profissional"
          path={paths.profissionais}
          rowFilter={(r) => r["perfil"] === "profissional_saude"}
          toPayload={toPessoaPayload("profissional_saude")}
          loadItem={carregarPaciente}
          idField="cpf"
          autoId={false}
          fields={profissionalFields}
          columns={["cpf", "name", "telephone"]}
        />
      )}

      {abaAtiva === "estagiarios" && (
        <ResourceManager
          title="Estagiários"
          singular="Estagiário"
          path={paths.estagiarios}
          rowFilter={(r) => r["perfil"] === "estagiario"}
          toPayload={toPessoaPayload("estagiario")}
          loadItem={carregarPaciente}
          idField="cpf"
          autoId={false}
          fields={estagiarioFields}
          columns={["cpf", "name", "telephone"]}
        />
      )}
    </div>
  );
}
