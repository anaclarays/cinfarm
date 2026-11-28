const endpoint = '/api/medicamento'

export class MedicamentoApiError extends Error {
  readonly status: number
  readonly erroNome?: string

  constructor(message: string, status: number, erroNome?: string) {
    super(message)
    this.status = status
    this.erroNome = erroNome
  }
}

async function verificarResposta(response: Response, mensagem: string) {
  if (response.ok) return

  const data = await response.json().catch(() => null)
  const errosNome = data?.errors?.nome_medicamento
  const erroNome = Array.isArray(errosNome)
    ? errosNome.filter((item) => typeof item === 'string').join(' ')
    : undefined

  throw new MedicamentoApiError(
    typeof data?.error === 'string' ? data.error : mensagem,
    response.status,
    erroNome,
  )
}

export async function salvarMedicamento(nome: string, id?: number) {
  const response = await fetch(
    id === undefined ? `${endpoint}/` : `${endpoint}/${id}`,
    {
      method: id === undefined ? 'POST' : 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nome_medicamento: nome }),
    },
  )
  await verificarResposta(response, 'Não foi possível salvar o medicamento.')
}

export async function excluirMedicamento(id: number) {
  const response = await fetch(`${endpoint}/${id}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  })
  await verificarResposta(response, 'Não foi possível excluir o medicamento.')
}
