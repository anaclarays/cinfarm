import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { Medicamentos } from './Medicamentos'

const medicamento = { medicamento_id: 7, nome_medicamento: 'Dipirona' }
const fetchMock = vi.fn<typeof fetch>()

function respostaLista(medicamentos = [medicamento]) {
  return Response.json({ medicamentos })
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

it('valida espaços, NUL e o limite em caracteres Unicode antes de cadastrar', async () => {
  fetchMock.mockResolvedValueOnce(respostaLista([]))
  const user = userEvent.setup()
  render(<Medicamentos />)
  await screen.findByText('Nenhum medicamento cadastrado.')
  const campo = screen.getByLabelText('Nome do medicamento')
  const cadastrar = screen.getByRole('button', { name: 'Cadastrar' })

  for (const valor of ['', ' \u0085\u001c ', 'A\0B', '💊'.repeat(201)]) {
    fireEvent.change(campo, { target: { value: valor } })
    await user.click(cadastrar)
    expect(campo).toHaveAttribute('aria-invalid', 'true')
  }
  expect(fetchMock).toHaveBeenCalledTimes(1)

  const nome = ` ${'💊'.repeat(198)} `
  const criado = { ...medicamento, nome_medicamento: nome }
  fetchMock
    .mockResolvedValueOnce(Response.json(criado, { status: 201 }))
    .mockResolvedValueOnce(respostaLista([criado]))
  fireEvent.change(campo, { target: { value: nome } })
  vi.useFakeTimers()
  await act(async () => {
    fireEvent.click(cadastrar)
  })

  const notificacao = screen.getByRole('status')
  expect(notificacao).toHaveTextContent('Medicamento cadastrado.')
  expect(fetchMock).toHaveBeenNthCalledWith(
    2,
    '/api/medicamento/',
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ nome_medicamento: nome }),
    }),
  )
  expect(screen.getByRole('cell', { name: nome.trim() })).toBeInTheDocument()
  expect(campo).toHaveValue('')

  act(() => {
    vi.advanceTimersByTime(1999)
  })
  expect(notificacao).toHaveTextContent('Medicamento cadastrado.')
  act(() => {
    vi.advanceTimersByTime(1)
  })
  expect(notificacao).toBeEmptyDOMElement()
})

it('edita pelo ID, apresenta a validação da API e atualiza a lista ao salvar', async () => {
  const alterado = { ...medicamento, nome_medicamento: 'Paracetamol' }
  fetchMock
    .mockResolvedValueOnce(respostaLista())
    .mockResolvedValueOnce(
      Response.json(
        { errors: { nome_medicamento: ['Nome inválido.'] } },
        { status: 400 },
      ),
    )
    .mockResolvedValueOnce(Response.json(alterado))
    .mockResolvedValueOnce(respostaLista([alterado]))
  const user = userEvent.setup()
  render(<Medicamentos />)
  await user.click(
    await screen.findByRole('button', { name: 'Editar Dipirona' }),
  )
  const campo = screen.getByLabelText('Nome do medicamento')
  expect(campo).toHaveValue('Dipirona')
  fireEvent.change(campo, { target: { value: 'Paracetamol' } })

  const salvar = screen.getByRole('button', { name: 'Salvar alterações' })
  await user.click(salvar)
  expect(await screen.findByRole('alert')).toHaveTextContent('Nome inválido.')
  expect(campo).toHaveValue('Paracetamol')
  expect(fetchMock).toHaveBeenNthCalledWith(
    2,
    '/api/medicamento/7',
    expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ nome_medicamento: 'Paracetamol' }),
    }),
  )

  await user.click(salvar)
  expect(
    await screen.findByRole('cell', { name: 'Paracetamol' }),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('cell', { name: 'Dipirona' }),
  ).not.toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent(
    'Medicamento atualizado.',
  )
})

it('exige confirmação da exclusão, exibe o conflito da API e atualiza a lista após um 204', async () => {
  fetchMock
    .mockResolvedValueOnce(respostaLista())
    .mockResolvedValueOnce(
      Response.json(
        { error: 'O medicamento possui registros vinculados.' },
        { status: 409 },
      ),
    )
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
    .mockResolvedValueOnce(respostaLista([]))
  const user = userEvent.setup()
  render(<Medicamentos />)
  const excluir = await screen.findByRole('button', {
    name: 'Excluir Dipirona',
  })
  await user.click(excluir)
  await user.click(screen.getByRole('button', { name: 'Cancelar exclusão' }))
  expect(fetchMock).toHaveBeenCalledTimes(1)

  await user.click(screen.getByRole('button', { name: 'Excluir Dipirona' }))
  const confirmar = screen.getByRole('button', { name: 'Confirmar exclusão' })
  await user.click(confirmar)
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'O medicamento possui registros vinculados.',
  )
  expect(screen.getByRole('cell', { name: 'Dipirona' })).toBeInTheDocument()
  expect(fetchMock).toHaveBeenNthCalledWith(
    2,
    '/api/medicamento/7',
    expect.objectContaining({ method: 'DELETE' }),
  )

  await user.click(confirmar)
  expect(
    await screen.findByText('Nenhum medicamento cadastrado.'),
  ).toBeInTheDocument()
  expect(screen.getByText('Medicamento excluído.')).toBeInTheDocument()
})
