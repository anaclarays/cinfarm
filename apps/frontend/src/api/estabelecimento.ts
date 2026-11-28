export const tiposAtendimento = {
  publico: 'Público',
  privado: 'Privado',
} as const

export type EstabelecimentoDados = {
  nome: string
  tipo_atendimento: keyof typeof tiposAtendimento
  logradouro: string
  numero: string | null
  complemento: string | null
  bairro: string
  cidade: string
  estado: string
  cep: string
}

export type Estabelecimento = EstabelecimentoDados & {
  estabelecimento_id: number
}

export class EstabelecimentoApiError extends Error {
  readonly errors?: Record<string, string>

  constructor(message: string, errors?: Record<string, string>) {
    super(message)
    this.name = 'EstabelecimentoApiError'
    this.errors = errors
  }
}

async function enviar(
  method: 'POST' | 'PATCH' | 'DELETE',
  id?: number,
  payload?: Partial<EstabelecimentoDados>,
) {
  const path = id === undefined ? '' : String(id)
  const response = await fetch(`/api/estabelecimento/${path}`, {
    method,
    headers: payload
      ? { Accept: 'application/json', 'Content-Type': 'application/json' }
      : { Accept: 'application/json' },
    body: payload ? JSON.stringify(payload) : undefined,
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    const errors = data?.errors as Record<string, string> | undefined
    throw new EstabelecimentoApiError(
      data?.error ??
        errors?.body ??
        (errors
          ? 'Revise os campos destacados.'
          : `Não foi possível concluir a operação (HTTP ${response.status}).`),
      errors,
    )
  }
}

export function criarEstabelecimento(dados: EstabelecimentoDados) {
  return enviar('POST', undefined, dados)
}

export function atualizarEstabelecimento(
  id: number,
  dados: Partial<EstabelecimentoDados>,
) {
  return enviar('PATCH', id, dados)
}

export function excluirEstabelecimento(id: number) {
  return enviar('DELETE', id)
}
