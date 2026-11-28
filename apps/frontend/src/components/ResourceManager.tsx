import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { api, type Row } from "../api/pessoas";

export type OptionSource = { 	
	path: string; value: string; label: string; prefix?: string;
	filter?: (r: Row) => boolean;
};
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

type FeedbackState = { type: "ok" | "err"; text: string } | null;

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
			return rows
			  .filter((r) => !s.filter || s.filter(r))
			  .map((r) => ({
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

function Feedback({ feedback }: { feedback: FeedbackState }) {
  if (!feedback) return null;
  const ok = feedback.type === "ok";
  return (
    <div className={`alert ${ok ? "alert-success" : "alert-error"}`} role="status">
      {ok ? <CheckCircle2 size={18} aria-hidden /> : <AlertCircle size={18} aria-hidden />}
      {feedback.text}
    </div>
  );
}

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
	rowFilter?: (row: Row) => boolean;
	toPayload?: (payload: Row, original?: Row) => Row;
	loadItem?: (row: Row) => Promise<Row>;
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
	rowFilter,
	toPayload,
	loadItem,
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
  const [feedback, setFeedback] = useState<FeedbackState>(null);

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
	  if (rowFilter && !rowFilter(r)) return false;
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
      const body = toPayload ? toPayload(payload, isNew ? undefined : editing!) : payload;
      return isNew ? api.create(path, idField, autoId, body) : api.update(path, idField, editing![idField], body);
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

  // MODO FORMULÁRIO EM TELA CHEIA
  if (editing) {
    return (
      <div className="list-card panel">
        <Feedback feedback={feedback} />
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
      <div className="list-card panel">
        <div className="panel-header">
          <h2>Detalhes — {singular}</h2>
          <button type="button" className="btn-secondary" onClick={() => setViewing(null)}>
            <ArrowLeft size={16} aria-hidden /> Voltar para listagem
          </button>
        </div>
        {detail(viewing)}
      </div>
    );
  }

  // MODO LISTAGEM PADRÃO
  return (
    <div className="form-stack">
      <Feedback feedback={feedback} />

      <div className="list-card">
        <div className="list-header">
          {!compact && <h2>{title}</h2>}

          <div className="toolbar">
            <div className="search-box">
              <Search size={16} aria-hidden />
              <input
                type="search"
                placeholder="Buscar..."
                aria-label="Buscar"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {filterDef?.options && (
              <select aria-label="Filtrar por status" value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="">Todos os status</option>
                {filterDef.options.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            )}

            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setIsNew(true);
                setEditing({});
              }}
            >
              <Plus size={16} aria-hidden /> Novo(a) {singular.toLowerCase()}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="list-state" role="status">
            <Loader2 className="spinner" size={28} aria-hidden />
            <p>Carregando...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="list-state">
            <p>Nenhum registro encontrado</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {colDefs.map((c) => (
                    <th key={c.name}>{c.label}</th>
                  ))}
                  <th className="col-actions">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={String(r[idField])}>
                    {colDefs.map((c) => (
                      <td key={c.name}>
                        {c.name === "status" ? <StatusBadge value={String(r[c.name] ?? "")} /> : display(c, r[c.name])}
                      </td>
                    ))}
                    <td className="col-actions">
                      {detail && (
                        <button
                          type="button"
                          className="icon-btn"
                          title="Detalhes"
                          aria-label="Detalhes"
                          onClick={() => setViewing(r)}
                        >
                          <Eye size={16} aria-hidden />
                        </button>
                      )}
                      <button
											  type="button"
											  className="icon-btn"
											  title="Editar"
											  aria-label="Editar"
											  onClick={async () => {
											    setIsNew(false);
											    const item = loadItem ? await loadItem(r) : r;
											    setEditing(item);
											  }}
											>
											  <Pencil size={16} aria-hidden />
											</button>
                      <button
                        type="button"
                        className="icon-btn icon-btn-danger"
                        title="Excluir"
                        aria-label="Excluir"
                        onClick={() => setDeleting(r)}
                      >
                        <Trash2 size={16} aria-hidden />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {deleting && (
        <div className="modal-backdrop">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <h3 id="modal-title">Excluir {singular.toLowerCase()}?</h3>
            <p>Esta ação não pode ser desfeita.</p>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setDeleting(null)}>
                Cancelar
              </button>
              <button type="button" className="btn-danger" onClick={() => del.mutate(deleting)}>
                <Trash2 size={16} aria-hidden /> Excluir
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
      className="form-stack"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(v);
      }}
    >
      <div className="panel-header">
        <div>
          <h2>{title}</h2>
          <p>Campos marcados com * são obrigatórios.</p>
        </div>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          <ArrowLeft size={16} aria-hidden /> Voltar
        </button>
      </div>

      {sections.map((s) => (
        <fieldset key={s} className="form-section">
          {s && <legend>{s}</legend>}
          <div className="form-grid form-grid-3">
            {fields
              .filter((f) => (f.section ?? "") === s && (!f.showIf || f.showIf(v)))
              .map((f) => {
                const val = v[f.name];
                const id = `f-${f.name}`;
                const full = f.full || f.type === "textarea" ? "field-full" : "";

                if (f.type === "boolean")
                  return (
                    <div key={f.name} className={`check-field ${full}`}>
                      <input id={id} type="checkbox" checked={!!val} onChange={(e) => set(f.name, e.target.checked)} />
                      <label htmlFor={id}>{f.label}</label>
                    </div>
                  );

                return (
                  <div key={f.name} className={`field ${full}`}>
                    <label htmlFor={id}>
                      {f.label}
                      {f.required && " *"}
                    </label>
                    {f.type === "textarea" ? (
                      <textarea
                        id={id}
                        rows={3}
                        value={String(val ?? "")}
                        onChange={(e) => set(f.name, e.target.value)}
                      />
                    ) : f.type === "select" ? (
                      <select
                        id={id}
                        required={f.required}
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
                      />
                    )}
                  </div>
                );
              })}
          </div>
        </fieldset>
      ))}

      <div className="form-footer">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const cls: Record<string, string> = {
    Agendado: "tag-neutral",
    Confirmado: "tag-info",
    "Concluído": "tag-success",
    Cancelado: "tag-danger",
  };
  return <span className={`tag ${cls[value] ?? "tag-neutral"}`}>{value || "—"}</span>;
}

export function DetailGrid({ row, fields }: { row: Row; fields: Field[] }) {
  return (
    <dl className="detail-grid">
      {fields
        .filter((f) => row[f.name] !== undefined && row[f.name] !== null && row[f.name] !== "")
        .map((f) => (
          <div key={f.name}>
            <dt>{f.label}</dt>
            <dd>{fmt(f, row[f.name])}</dd>
          </div>
        ))}
    </dl>
  );
}