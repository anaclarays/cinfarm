import { useState } from "react";
import { paths, type Row } from "../services/api";
import { PageHeader } from "../components/PageHeader";
import { DetailGrid, ResourceManager } from "../components/ResourceManager";
import {
  condicaoFields,
  estagiarioFields,
  exameFields,
  pacienteFields,
  profissionalFields,
  reacaoFields,
} from "../components/fields";

function Prontuario({ row }: { row: Row }) {
  const [abaProntuario, setAbaProntuario] = useState<"condicoes" | "exames" | "reacoes">("condicoes");
  const cpf = String(row["cpf"] ?? "");

  return (
    <div className="space-y-4">
      <div className="border-b border-slate-200 pb-3">
        <h3 className="text-lg font-semibold text-slate-900">
          Prontuário · {String(row["nome_completo"] ?? "")}
        </h3>
        <p className="text-sm text-slate-500">CPF {cpf}</p>
      </div>

      <DetailGrid row={row} fields={pacienteFields} />

      <div className="pt-2">
        <div className="mb-4 inline-flex rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setAbaProntuario("condicoes")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              abaProntuario === "condicoes"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Condições de saúde
          </button>
          <button
            type="button"
            onClick={() => setAbaProntuario("exames")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              abaProntuario === "exames"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Exames
          </button>
          <button
            type="button"
            onClick={() => setAbaProntuario("reacoes")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              abaProntuario === "reacoes"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Reações alérgicas
          </button>
        </div>

        {abaProntuario === "condicoes" && (
          <ResourceManager
            compact
            title="Condições"
            singular="Condição"
            path={paths.condicoes(cpf)}
            idField="condicao_id"
            fields={condicaoFields}
            columns={["condicao_id", "nome_condicao", "tipo", "data_inicio"]}
          />
        )}

        {abaProntuario === "exames" && (
          <ResourceManager
            compact
            title="Exames"
            singular="Exame"
            path={paths.exames(cpf)}
            idField="exame_id"
            fields={exameFields}
            columns={["exame_id", "nome_exame", "data_realizacao", "resultado"]}
          />
        )}

        {abaProntuario === "reacoes" && (
          <ResourceManager
            compact
            title="Reações"
            singular="Reação"
            path={paths.reacoes(cpf)}
            idField="reacao_alergica_id"
            fields={reacaoFields}
            columns={["reacao_alergica_id", "medicamento_id", "descricao", "data_ocorrencia"]}
          />
        )}
      </div>
    </div>
  );
}

export function Pessoas() {
  const [abaAtiva, setAbaAtiva] = useState<"pacientes" | "profissionais" | "estagiarios">("pacientes");

  return (
    <div>
      <PageHeader
        title="Pessoas & Perfis"
        description="Gerencie pacientes, profissionais de saúde e estagiários."
      />

      <div className="mb-4 inline-flex rounded-lg bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setAbaAtiva("pacientes")}
          className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition ${
            abaAtiva === "pacientes"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Pacientes
        </button>
        <button
          type="button"
          onClick={() => setAbaAtiva("profissionais")}
          className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition ${
            abaAtiva === "profissionais"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Profissionais de saúde
        </button>
        <button
          type="button"
          onClick={() => setAbaAtiva("estagiarios")}
          className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition ${
            abaAtiva === "estagiarios"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Estagiários
        </button>
      </div>

      {abaAtiva === "pacientes" && (
        <ResourceManager
          title="Pacientes"
          singular="Paciente"
          path={paths.pacientes}
          idField="cpf"
          autoId={false}
          fields={pacienteFields}
          columns={["cpf", "nome_completo", "telefone", "cartao_sus", "data_nascimento", "cidade"]}
          detail={(r) => <Prontuario row={r} />}
        />
      )}

      {abaAtiva === "profissionais" && (
        <ResourceManager
          title="Profissionais de saúde"
          singular="Profissional"
          path={paths.profissionais}
          idField="cpf"
          autoId={false}
          fields={profissionalFields}
          columns={["cpf", "nome_completo", "especialidade", "conselho", "numero_registro", "telefone"]}
        />
      )}

      {abaAtiva === "estagiarios" && (
        <ResourceManager
          title="Estagiários"
          singular="Estagiário"
          path={paths.estagiarios}
          idField="cpf"
          autoId={false}
          fields={estagiarioFields}
          columns={["cpf", "nome_completo", "curso", "instituicao_ensino", "telefone"]}
        />
      )}
    </div>
  );
}