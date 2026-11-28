import {
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { Estabelecimentos } from './Estabelecimentos'

afterEach(() => vi.unstubAllGlobals())

if (!HTMLDialogElement.prototype.showModal) {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: {
      value(this: HTMLDialogElement) {
        this.open = true
      },
    },
    close: {
      value(this: HTMLDialogElement) {
        this.open = false
      },
    },
  })
}

const pagina = (
  <Estabelecimentos
    title="Estabelecimentos"
    description="Gerencie os cadastros."
  />
)

const dados = {
  nome: 'UBS Centro',
  tipo_atendimento: 'publico',
  logradouro: 'Rua das Flores',
  numero: null,
  complemento: 'Bloco B',
  bairro: 'Centro',
  cidade: 'Recife',
  estado: 'PE',
  cep: '01234567',
}

it('valida o formulário, preserva os dados na rejeição da API e recarrega a lista após cadastrar', async () => {
  const user = userEvent.setup()
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ estabelecimentos: [] }))
    .mockResolvedValueOnce(
      Response.json(
        { errors: { cidade: 'Mensagem da API.' } },
        { status: 400 },
      ),
    )
    .mockResolvedValueOnce(
      Response.json({ ...dados, estabelecimento_id: 4 }, { status: 201 }),
    )
    .mockResolvedValueOnce(
      Response.json({
        estabelecimentos: [{ ...dados, estabelecimento_id: 4 }],
      }),
    )
  vi.stubGlobal('fetch', fetchMock)
  render(pagina)
  await screen.findByText('Nenhum estabelecimento cadastrado.')
  const titulo = screen.getByRole('heading', {
    level: 1,
    name: 'Estabelecimentos',
  })
  const novo = within(titulo.closest('header')!).getByRole('button', {
    name: 'Novo estabelecimento',
  })

  await user.click(novo)
  const modal = screen.getByRole('dialog', { name: 'Novo estabelecimento' })
  fireEvent(modal, new Event('cancel', { cancelable: true }))
  expect(modal).not.toBeInTheDocument()
  expect(novo).toHaveFocus()

  await user.click(novo)
  const painel = within(
    screen.getByRole('dialog', { name: 'Novo estabelecimento' }),
  )
  const cadastrar = painel.getByRole('button', {
    name: 'Cadastrar estabelecimento',
  })
  await user.click(cadastrar)
  expect(painel.getAllByText('Campo obrigatório.')).toHaveLength(7)

  for (const [label, value] of [
    ['Nome', dados.nome],
    ['Tipo de atendimento', dados.tipo_atendimento],
    ['Logradouro', dados.logradouro],
    ['Complemento (opcional)', dados.complemento],
    ['Bairro', dados.bairro],
    ['Cidade', dados.cidade],
    ['CEP', '1234-567'],
  ]) {
    fireEvent.change(painel.getByLabelText(label), { target: { value } })
  }
  const uf = painel.getByRole('combobox', { name: 'UF' })
  expect(within(uf).getAllByRole('option')).toHaveLength(28)
  expect(within(uf).getByRole('option', { name: 'DF' })).toBeInTheDocument()
  await user.selectOptions(uf, dados.estado)
  await user.click(cadastrar)
  expect(painel.getByLabelText('CEP')).toHaveAttribute('aria-invalid', 'true')
  expect(fetchMock).toHaveBeenCalledTimes(1)

  const cep = painel.getByLabelText('CEP')
  await user.clear(cep)
  await user.type(cep, '01234-a5679')
  expect(cep).toHaveValue(dados.cep)
  await user.click(cadastrar)
  expect(await painel.findByText('Mensagem da API.')).toBeInTheDocument()
  expect(painel.getByLabelText('Cidade')).toHaveValue(dados.cidade)
  expect(fetchMock).toHaveBeenNthCalledWith(
    2,
    '/api/estabelecimento/',
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(dados),
    }),
  )

  await user.click(cadastrar)
  const notificacao = await screen.findByText(
    'Estabelecimento cadastrado com sucesso.',
  )
  expect(notificacao).toHaveClass('estabelecimento-notificacao')
  expect(
    await screen.findByRole('cell', { name: dados.nome }),
  ).toBeInTheDocument()
  await waitForElementToBeRemoved(notificacao, { timeout: 2500 })
})

it('usa os filtros da API, envia apenas o campo alterado e mostra conflito ao excluir', async () => {
  const user = userEvent.setup()
  const registro = { ...dados, estabelecimento_id: 4 }
  const atualizado = { ...registro, complemento: null }
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ estabelecimentos: [registro] }))
    .mockResolvedValueOnce(Response.json({ estabelecimentos: [registro] }))
    .mockResolvedValueOnce(Response.json(atualizado))
    .mockResolvedValueOnce(Response.json({ estabelecimentos: [atualizado] }))
    .mockResolvedValueOnce(
      Response.json(
        { error: 'O estabelecimento possui consultas vinculadas.' },
        { status: 409 },
      ),
    )
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
    .mockResolvedValueOnce(Response.json({ estabelecimentos: [] }))
  vi.stubGlobal('fetch', fetchMock)
  render(pagina)
  await screen.findByRole('cell', { name: dados.nome })
  expect(screen.getAllByRole('columnheader').at(-1)).toHaveTextContent('Ações')

  const filtros = within(screen.getByRole('form', { name: 'Filtros' }))
  await user.type(filtros.getByLabelText('Nome'), 'UBS Centro')
  await user.selectOptions(
    filtros.getByRole('combobox', { name: 'UF' }),
    dados.estado,
  )
  await user.selectOptions(
    filtros.getByLabelText('Tipo de atendimento'),
    'publico',
  )
  await user.click(filtros.getByRole('button', { name: 'Filtrar' }))
  const urlFiltrada =
    '/api/estabelecimento/?nome=UBS+Centro&estado=PE&tipo_atendimento=publico'
  expect(fetchMock).toHaveBeenNthCalledWith(2, urlFiltrada, expect.anything())

  await user.click(
    await screen.findByRole('button', { name: 'Editar UBS Centro' }),
  )
  const painel = within(
    screen.getByRole('dialog', { name: 'Editar estabelecimento' }),
  )
  expect(painel.getByRole('combobox', { name: 'UF' })).toHaveValue(dados.estado)
  expect(painel.getByLabelText('CEP')).toHaveValue(dados.cep)
  expect(painel.getByLabelText('Complemento (opcional)')).toHaveValue(
    dados.complemento,
  )
  await user.clear(painel.getByLabelText('Complemento (opcional)'))
  await user.click(painel.getByRole('button', { name: 'Salvar alterações' }))
  expect(
    await screen.findByText('Estabelecimento atualizado com sucesso.'),
  ).toHaveClass('estabelecimento-notificacao')
  expect(fetchMock).toHaveBeenNthCalledWith(
    3,
    '/api/estabelecimento/4',
    expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ complemento: null }),
    }),
  )
  expect(fetchMock).toHaveBeenNthCalledWith(4, urlFiltrada, expect.anything())

  await user.click(
    await screen.findByRole('button', { name: 'Excluir UBS Centro' }),
  )
  expect(fetchMock).toHaveBeenCalledTimes(4)
  const exclusao = within(
    screen.getByRole('dialog', { name: 'Excluir estabelecimento' }),
  )
  const confirmar = exclusao.getByRole('button', { name: 'Confirmar exclusão' })
  await user.click(confirmar)
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'O estabelecimento possui consultas vinculadas.',
  )
  await user.click(confirmar)
  const notificacao = await screen.findByText(
    'Estabelecimento excluído com sucesso.',
  )
  expect(notificacao).toHaveClass('estabelecimento-notificacao')
  expect(
    await screen.findByText('Nenhum estabelecimento corresponde aos filtros.'),
  ).toBeInTheDocument()
  expect(fetchMock).toHaveBeenNthCalledWith(
    6,
    '/api/estabelecimento/4',
    expect.objectContaining({ method: 'DELETE' }),
  )
  await waitForElementToBeRemoved(notificacao, { timeout: 2500 })
})
