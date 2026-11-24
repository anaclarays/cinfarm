export type Agendamento = {
  agendamento_id: number
  data_hora_prevista: string
  status: string
  paciente: string
  profissional_saude: string
}

export type Pessoa = {
  cpf: string
  name: string
  telephone: string
  perfil: 'paciente' | 'profissional_saude' | 'estagiario' | null
}

export type Medicamento = { medicamento_id: number; nome_medicamento: string }

export type Estabelecimento = {
  estabelecimento_id: number
  nome: string
  tipo_atendimento: 'publico' | 'privado'
  logradouro: string
  numero: string | null
  bairro: string
  cidade: string
  estado: string
}

export type ListaApi = {
  agendamento: { key: 'agendamentos'; row: Agendamento }
  pessoa: { key: 'All people'; row: Pessoa }
  medicamento: { key: 'medicamentos'; row: Medicamento }
  estabelecimento: { key: 'estabelecimentos'; row: Estabelecimento }
}

export async function buscarLista<Resource extends keyof ListaApi>(
  resource: Resource,
  key: ListaApi[Resource]['key'],
  signal: AbortSignal,
): Promise<ListaApi[Resource]['row'][]> {
  const response = await fetch(`/api/${resource}/`, {
    headers: { Accept: 'application/json' },
    signal,
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const data = await response.json()
  const items = data?.[key]
  if (!Array.isArray(items)) throw new Error('Resposta inválida da API')
  return items
}
