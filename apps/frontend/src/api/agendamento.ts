export type TipoParametroInput = {
  tipo: string
  unidade_medida: string
  faixa_referencia: string
}

export type MedicaoClinicaInput = {
  profissional_saude_cpf: string
  valor: string
  data_medicao: string
  hora_medicao: string
  tipo_parametro: TipoParametroInput
}

export type CriarAgendamentoPayload = {
  paciente_cpf: string
  profissional_saude_cpf: string
  data_hora_prevista: string
  status: string
  observacoes?: string | null
  medicoes_clinicas: MedicaoClinicaInput[]
}

export type TipoParametroCriado = TipoParametroInput & {
  parametro_id: number
}

export type MedicaoClinicaCriada = Omit<MedicaoClinicaInput, 'tipo_parametro'> & {
  medicao_id: number
  agendamento_id: number
  parametro_id: number
  tipo_parametro: TipoParametroCriado
}

export type AgendamentoCriado = {
  agendamento_id: number
  paciente_cpf: string
  profissional_saude_cpf: string
  data_hora_prevista: string
  status: string
  observacoes: string | null
  medicoes_clinicas: MedicaoClinicaCriada[]
}

export type ApiFieldErrors = Record<string, unknown>

export class AgendamentoApiError extends Error {
  status: number
  errors?: ApiFieldErrors

  constructor(message: string, status: number, errors?: ApiFieldErrors) {
    super(message)
    this.name = 'AgendamentoApiError'
    this.status = status
    this.errors = errors
  }
}

export async function criarAgendamento(
  payload: CriarAgendamentoPayload,
): Promise<AgendamentoCriado> {
  const response = await fetch('/api/agendamento/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const serverMessage =
      typeof data?.error === 'string'
        ? data.error
        : data?.errors
          ? 'Verifique os campos destacados e tente novamente.'
          : `Erro ao criar agendamento (HTTP ${response.status}).`

    const fieldErrors =
      data?.errors && typeof data.errors === 'object'
        ? (data.errors as ApiFieldErrors)
        : undefined

    throw new AgendamentoApiError(serverMessage, response.status, fieldErrors)
  }

  return data as AgendamentoCriado
}
