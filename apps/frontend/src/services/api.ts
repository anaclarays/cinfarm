// Central HTTP layer for the CInfarm Flask API, with in-memory mock fallback when offline.
export const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export type Row = Record<string, unknown>;

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

let online: boolean | null = null;
const listeners = new Set<(v: boolean | null) => void>();
export const getApiStatus = () => online;
export function onApiStatus(fn: (v: boolean | null) => void) {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}
function setOnline(v: boolean) {
  if (online !== v) {
    online = v;
    listeners.forEach((l) => l(v));
  }
}

async function http<T>(method: string, path: string, body?: unknown): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 3000);
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? null : JSON.stringify(body),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(t);
  }
  if (!res.ok) {
    let msg = `Erro ${res.status}`;
    try {
      const j = await res.json();
      msg = j.error || j.message || msg;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, msg);
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

async function withFallback<T>(remote: () => Promise<T>, mock: () => T): Promise<T> {
  try {
    const r = await remote();
    setOnline(true);
    return r;
  } catch (e) {
    if (e instanceof ApiError) {
      setOnline(true);
      throw e;
    }
    setOnline(false);
    return mock();
  }
}

// ---------- Mock store ----------
const today = new Date();
const d = (offsetDays: number, h = 9) => {
  const x = new Date(today);
  x.setDate(x.getDate() + offsetDays);
  x.setHours(h, 0, 0, 0);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(x.getHours())}:00`;
};

const store: Record<string, Row[]> = {
  pacientes: [
    { cpf: "11122233344", nome_completo: "Maria Aparecida Souza", telefone: "81999990001", rg: "1234567", cartao_sus: "700000000000001", genero: "Feminino", data_nascimento: "1958-04-12", sexo_bio: "Feminino", escolaridade: "Fundamental", cidade: "Recife", estado: "PE", possui_plano_saude: false },
    { cpf: "22233344455", nome_completo: "José Carlos Lima", telefone: "81999990002", rg: "7654321", cartao_sus: "700000000000002", genero: "Masculino", data_nascimento: "1971-09-30", sexo_bio: "Masculino", escolaridade: "Médio", cidade: "Olinda", estado: "PE", possui_plano_saude: true, operadora: "Hapvida" },
  ],
  profissionais: [
    { cpf: "33344455566", nome_completo: "Dra. Ana Beatriz Rocha", telefone: "81988880001", instituicao_vinculo: "UFPE", especialidade: "Farmácia Clínica", conselho: "CRF", numero_registro: "PE-12345" },
  ],
  estagiarios: [
    { cpf: "44455566677", nome_completo: "Lucas Mendes", telefone: "81977770001", curso: "Farmácia", instituicao_ensino: "UFPE" },
  ],
  estabelecimentos: [
    { estabelecimento_id: 1, nome: "Ambulatório CIn Saúde", tipo_atendimento: "Ambulatorial", logradouro: "Av. Jorn. Aníbal Fernandes", numero: "s/n", bairro: "Cidade Universitária", cidade: "Recife", estado: "PE", cep: "50740560" },
  ],
  agendamentos: [
    { agendamento_id: 1, paciente_cpf: "11122233344", profissional_saude_cpf: "33344455566", data_hora_prevista: d(0, 10), status: "Confirmado", observacoes: "Revisão de medicamentos" },
    { agendamento_id: 2, paciente_cpf: "22233344455", profissional_saude_cpf: "33344455566", data_hora_prevista: d(0, 14), status: "Agendado", observacoes: "" },
    { agendamento_id: 3, paciente_cpf: "11122233344", profissional_saude_cpf: "33344455566", data_hora_prevista: d(3, 9), status: "Agendado", observacoes: "Aferir pressão" },
  ],
  consultas: [
    { consulta_id: 1, paciente_cpf: "11122233344", profissional_supervisor_cpf: "33344455566", responsavel_atendimento_id: "44455566677", estabelecimento_id: 1, data_realizacao: d(-2).slice(0, 10), especialidade_medica: "Farmácia Clínica" },
  ],
  medicamentos: [
    { medicamento_id: 1, nome_medicamento: "Losartana 50mg" },
    { medicamento_id: 2, nome_medicamento: "Metformina 850mg" },
    { medicamento_id: 3, nome_medicamento: "Dipirona 500mg" },
  ],
  uso_medicamentos: [
    { uso_medicamento_id: 1, paciente_cpf: "11122233344", medicamento_id: 1, nome: "Losartana", forma_farmaceutica: "Comprimido", frequencia_de_uso: "1x ao dia", dose: "50mg", via_administrativa: "Oral", data_inicio: "2026-01-10" },
  ],
};

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const table = (path: string) => (store[path] ??= []);

const mock = {
  list: (path: string) => clone(table(path)),
  create: (path: string, idField: string, auto: boolean, data: Row) => {
    const rows = table(path);
    const row = { ...data };
    if (auto) row[idField] = rows.reduce((m, r) => Math.max(m, Number(r[idField]) || 0), 0) + 1;
    else if (rows.some((r) => String(r[idField]) === String(row[idField])))
      throw new ApiError(409, "Registro com esta chave já existe");
    rows.push(row);
    return clone(row);
  },
  update: (path: string, idField: string, id: unknown, data: Row) => {
    const rows = table(path);
    const i = rows.findIndex((r) => String(r[idField]) === String(id));
    if (i < 0) throw new ApiError(404, "Registro não encontrado");
    rows[i] = { ...rows[i], ...data, [idField]: rows[i]![idField] };
    return clone(rows[i]!);
  },
  remove: (path: string, idField: string, id: unknown) => {
    store[path] = table(path).filter((r) => String(r[idField]) !== String(id));
    return null;
  },
};

export const api = {
  list: (path: string) => withFallback(() => http<Row[]>("GET", path), () => mock.list(path)),
  create: (path: string, idField: string, auto: boolean, data: Row) =>
    withFallback(() => http<Row>("POST", path, data), () => mock.create(path, idField, auto, data)),
  update: (path: string, idField: string, id: unknown, data: Row) =>
    withFallback(
      () => http<Row>("PUT", `${path}/${encodeURIComponent(String(id))}`, data),
      () => mock.update(path, idField, id, data),
    ),
  remove: (path: string, idField: string, id: unknown) =>
    withFallback(
      () => http<null>("DELETE", `${path}/${encodeURIComponent(String(id))}`),
      () => mock.remove(path, idField, id),
    ),
};

// REST paths
export const paths = {
  pacientes: "pacientes",
  profissionais: "profissionais",
  estagiarios: "estagiarios",
  estabelecimentos: "estabelecimentos",
  agendamentos: "agendamentos",
  consultas: "consultas",
  medicamentos: "medicamentos",
  usoMedicamentos: "uso_medicamentos",
  condicoes: (cpf: string) => `pacientes/${cpf}/condicoes`,
  exames: (cpf: string) => `pacientes/${cpf}/exames`,
  reacoes: (cpf: string) => `pacientes/${cpf}/reacoes_alergicas`,
  parametros: (id: unknown) => `agendamentos/${id}/parametros`,
  medicoes: (id: unknown) => `agendamentos/${id}/medicoes`,
};