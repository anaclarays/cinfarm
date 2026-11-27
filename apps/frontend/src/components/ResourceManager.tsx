import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { api, type Row } from "../services/api";

export type OptionSource = { path: string; value: string; label: string; prefix?: string };
export type Field = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "datetime-local" | "time" | "textarea" | "boolean" | "select";
  options?: string[];
  optionsFrom?: OptionSource[];
  required?: boolean;
  section?: string;
  full?: boolean;
  showIf?: (v: Row) => boolean;
};

export function useOptions(fields: Field[]) {
  const sources = useMemo(() => {
    const m = new Map<string, OptionSource>();
    fields.forEach((f) => f.optionsFrom?.forEach((s) => m.set(s.path, s)));
    return [...m.values()];
  }, [fields]);
  const results = useQueries({
    queries: sources.map((s) => ({ queryKey: ["res", s.path], queryFn: () => api.list(s.path) })),
  });
  return (f: Field) =>
    (f.optionsFrom ?? []).flatMap((s) => {
      const i = sources.findIndex((x) => x.path === s.path);
      const rows = (results[i]?.data ?? []) as Row[];
      return rows.map((r) => ({
        value: String(r[s.value]),
        label: `${s.prefix ? s.prefix + " · " : ""}${String(r[s.label] ?? r[s.value])}`,
      }));
    });
}

const fmt = (f: Field, v: unknown) => {
  if (v === null || v === undefined || v === "") return "—";
  if (f.type === "boolean") return v ? "Sim" : "Não";
  if (f.type === "date") return String(v).slice(0, 10).split("-").reverse().join("/");
  if (f.type === "datetime-local") {
    const dt = new Date(String(v));
    return isNaN(+dt) ? String(v) : dt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  }
  return String(v);
};

type Props = {
  title: string;
  singular: string;
  path: string;
  idField: string;
  autoId?: boolean;
  fields: Field[];
  columns: string[];
  filterField?: string;
  detail?: (row: Row) => ReactNode;
  compact?: boolean;
};

export function ResourceManager({
  title,
  singular,
  path,
  idField,
  autoId = true,
  fields,
  columns,
  filterField,
  detail,
  compact,
}: Props) {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["res", path], queryFn: () => api.list(path) });
  const optionsFor = useOptions(fields);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [viewing, setViewing] = useState<Row | null>(null);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const notify = (type: "ok" | "err", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const allCols: Field[] = [
    ...(autoId && !fields.some((f) => f.name === idField) ? [{ name: idField, label: "ID" } as Field] : []),
    ...fields,
  ];
  const colDefs = columns.map((c) => allCols.find((f) => f.name === c) ?? { name: c, label: c });
  const filterDef = fields.find((f) => f.name === filterField);

  const display = (f: Field, v: unknown) => {
    if (f.optionsFrom) {
      const o = optionsFor(f).find((o) => o.value === String(v));
      if (o) return o.label;
    }
    return fmt(f, v);
  };

  const rows = (data as Row[]).filter((r) => {
    if (filter && String(r[filterField!]) !== filter) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return colDefs.some((c) => display(c, r[c.name]).toLowerCase().includes(s));
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["res"] });
  const save = useMutation({
    mutationFn: (v: Row) => {
      const payload: Row = {};
      fields.forEach((f) => {
        let x = v[f.name];
        if (f.type === "boolean") x = !!x;
        else if (x === "" || x === undefined) x = null;
        else if (f.type === "number") x = Number(x);
        payload[f.name] = x;
      });
      return isNew ? api.create(path, idField, autoId, payload) : api.update(path, idField, editing![idField], payload);
    },
    onSuccess: () => {
      notify("ok", isNew ? `${singular} cadastrado(a) com sucesso!` : `${singular} atualizado(a) com sucesso!`);
      setEditing(null);
      invalidate();
    },
    onError: (e: Error) => notify("err", `Não foi possível salvar: ${e.message}`),
  });

  const del = useMutation({
    mutationFn: (r: Row) => api.remove(path, idField, r[idField]),
    onSuccess: () => {
      notify("ok", `${singular} excluído(a) com sucesso!`);
      setDeleting(null);
      invalidate();
    },
    onError: (e: Error) => notify("err", `Não foi possível excluir: ${e.message}`),
  });

  const sections = [...new Set(fields.map((f) => f.section ?? ""))];

  // MODO FORMULÁRIO EM TELA CHEIA (substitui o painel lateral apertado)
  if (editing) {
    return (
      <div className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        {feedback && (
          <div
            className={`mb-4 rounded-md px-4 py-3 text-sm font-medium ${
              feedback.type === "ok" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {feedback.text}
          </div>
        )}
        <FormBody
          key={String(editing[idField] ?? "new")}
          initial={editing}
          fields={fields}
          sections={sections}
          optionsFor={optionsFor}
          lockField={!isNew && !autoId ? idField : undefined}
          title={`${isNew ? "Cadastrar" : "Editar"} ${singular.toLowerCase()}`}
          saving={save.isPending}
          onSubmit={(v) => save.mutate(v)}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  // MODO DETALHES EM TELA CHEIA
  if (viewing && detail) {
    return (
      <div className="w-full space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h2 className="text-lg font-semibold text-slate-900">Detalhes — {singular}</h2>
          <button
            type="button"
            onClick={() => setViewing(null)}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar para listagem
          </button>
        </div>
        {detail(viewing)}
      </div>
    );
  }

  // MODO LISTAGEM PADRÃO
  return (
    <div className="space-y-4">
      {feedback && (
        <div
          className={`rounded-md px-4 py-3 text-sm font-medium ${
            feedback.type === "ok" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {!compact && <h2 className="mr-auto text-lg font-semibold text-slate-900">{title}</h2>}
        <div className={`relative ${compact ? "mr-auto" : ""}`}>
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            className="h-9 w-64 rounded-md border border-slate-300 bg-white pl-8 pr-3 text-sm focus:border-teal-600 focus:outline-none"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {filterDef?.options && (
          <select
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-teal-600 focus:outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">Todos os status</option>
            {filterDef.options.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        )}
        <button
          type="button"
          onClick={() => {
            setIsNew(true);
            setEditing({});
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-teal-600 px-3.5 text-sm font-medium text-white hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" /> Novo(a) {singular.toLowerCase()}
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-600">
              {colDefs.map((c) => (
                <th key={c.name} className="px-4 py-3">
                  {c.label}
                </th>
              ))}
              <th className="w-32 px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan={colDefs.length + 1} className="py-8 text-center text-slate-500">
                  Carregando...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={colDefs.length + 1} className="py-8 text-center text-slate-500">
                  Nenhum registro encontrado
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={String(r[idField])} className="hover:bg-slate-50">
                  {colDefs.map((c) => (
                    <td key={c.name} className="px-4 py-3 text-slate-700">
                      {c.name === "status" ? <StatusBadge value={String(r[c.name] ?? "")} /> : display(c, r[c.name])}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {detail && (
                      <button
                        type="button"
                        title="Detalhes"
                        onClick={() => setViewing(r)}
                        className="mr-1 inline-flex rounded p-1.5 text-slate-600 hover:bg-slate-100"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      title="Editar"
                      onClick={() => {
                        setIsNew(false);
                        setEditing(r);
                      }}
                      className="mr-1 inline-flex rounded p-1.5 text-slate-600 hover:bg-slate-100"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title="Excluir"
                      onClick={() => setDeleting(r)}
                      className="inline-flex rounded p-1.5 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Excluir {singular.toLowerCase()}?</h3>
            <p className="mt-2 text-sm text-slate-600">Esta ação não pode ser desfeita.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => del.mutate(deleting)}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormBody({
  initial,
  fields,
  sections,
  optionsFor,
  lockField,
  title,
  saving,
  onSubmit,
  onCancel,
}: {
  initial: Row;
  fields: Field[];
  sections: string[];
  optionsFor: (f: Field) => { value: string; label: string }[];
  lockField?: string | undefined;
  title: string;
  saving: boolean;
  onSubmit: (v: Row) => void;
  onCancel: () => void;
}) {
  const [v, setV] = useState<Row>(() => {
    const o: Row = { ...initial };
    fields.forEach((f) => {
      if (f.type === "datetime-local" && o[f.name]) o[f.name] = String(o[f.name]).slice(0, 16);
      if (f.type === "date" && o[f.name]) o[f.name] = String(o[f.name]).slice(0, 10);
    });
    return o;
  });
  const set = (k: string, x: unknown) => setV((p) => ({ ...p, [k]: x }));

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(v);
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">Campos marcados com * são obrigatórios.</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
      </div>

      <div className="space-y-6">
        {sections.map((s) => (
          <fieldset key={s} className="rounded-lg border border-slate-200 p-4">
            {s && <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-teal-700">{s}</legend>}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {fields
                .filter((f) => (f.section ?? "") === s && (!f.showIf || f.showIf(v)))
                .map((f) => {
                  const val = v[f.name];
                  const id = `f-${f.name}`;
                  const span = f.full || f.type === "textarea" ? "md:col-span-2 lg:col-span-3" : "";
                  if (f.type === "boolean")
                    return (
                      <div key={f.name} className={`flex items-center gap-3 rounded-md border border-slate-200 p-3 ${span}`}>
                        <input
                          id={id}
                          type="checkbox"
                          checked={!!val}
                          onChange={(e) => set(f.name, e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-teal-600"
                        />
                        <label htmlFor={id} className="text-sm font-medium text-slate-700">
                          {f.label}
                        </label>
                      </div>
                    );
                  return (
                    <div key={f.name} className={`space-y-1.5 ${span}`}>
                      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
                        {f.label}
                        {f.required && " *"}
                      </label>
                      {f.type === "textarea" ? (
                        <textarea
                          id={id}
                          rows={3}
                          value={String(val ?? "")}
                          onChange={(e) => set(f.name, e.target.value)}
                          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                        />
                      ) : f.type === "select" ? (
                        <select
                          id={id}
                          required={f.required}
                          className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-teal-600 focus:outline-none"
                          value={String(val ?? "")}
                          onChange={(e) => set(f.name, e.target.value)}
                        >
                          <option value="">Selecione...</option>
                          {(f.options ? f.options.map((o) => ({ value: o, label: o })) : optionsFor(f)).map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id={id}
                          type={f.type ?? "text"}
                          required={f.required}
                          disabled={f.name === lockField}
                          step={f.type === "number" ? "any" : undefined}
                          value={String(val ?? "")}
                          onChange={(e) => set(f.name, e.target.value)}
                          className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm disabled:bg-slate-100 focus:border-teal-600 focus:outline-none"
                        />
                      )}
                    </div>
                  );
                })}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-teal-600 px-5 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const cls: Record<string, string> = {
    Agendado: "bg-slate-100 text-slate-700",
    Confirmado: "bg-teal-100 text-teal-800",
    "Concluído": "bg-emerald-100 text-emerald-800",
    Cancelado: "bg-red-100 text-red-800",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cls[value] ?? "bg-slate-100 text-slate-700"}`}>
      {value || "—"}
    </span>
  );
}

export function DetailGrid({ row, fields }: { row: Row; fields: Field[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-3">
      {fields
        .filter((f) => row[f.name] !== undefined && row[f.name] !== null && row[f.name] !== "")
        .map((f) => (
          <div key={f.name}>
            <dt className="text-xs text-slate-500">{f.label}</dt>
            <dd className="font-medium text-slate-900">{fmt(f, row[f.name])}</dd>
          </div>
        ))}
    </dl>
  );
}