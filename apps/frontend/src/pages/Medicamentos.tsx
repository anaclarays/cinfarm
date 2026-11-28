import { type FormEvent, useEffect, useRef, useState } from 'react'
import {
  excluirMedicamento,
  MedicamentoApiError,
  salvarMedicamento,
} from '../api/medicamento'
import type { Medicamento } from '../api/listas'
import { Lista } from '../components/Lista'

function validarNome(nome: string) {
  // Inclui os espaços adicionais reconhecidos pelo str.strip() do Python.
  // oxlint-disable-next-line eslint/no-control-regex
  if (/^[\p{White_Space}\u001c-\u001f]*$/u.test(nome) || nome.includes('\0')) {
    return 'Informe um texto não vazio e válido.'
  }
  if ([...nome].length > 200) {
    return 'O nome deve ter no máximo 200 caracteres.'
  }
  return ''
}

export function Medicamentos() {
  const campoNome = useRef<HTMLTextAreaElement>(null)
  const [nome, setNome] = useState('')
  const [idEdicao, setIdEdicao] = useState<number>()
  const [idExclusao, setIdExclusao] = useState<number>()
  const [ocupado, setOcupado] = useState(false)
  const [revisao, setRevisao] = useState(0)
  const [erroNome, setErroNome] = useState('')
  const [erroGeral, setErroGeral] = useState('')
  const [erroExclusao, setErroExclusao] = useState('')
  const [sucesso, setSucesso] = useState<{ mensagem: string }>()
  const editando = idEdicao !== undefined

  useEffect(() => {
    if (!sucesso) return
    const timeout = window.setTimeout(() => setSucesso(undefined), 2000)
    return () => window.clearTimeout(timeout)
  }, [sucesso])

  function limparMensagens() {
    setErroNome('')
    setErroGeral('')
  }

  function limparFormulario() {
    setNome('')
    setIdEdicao(undefined)
  }

  function iniciarEdicao(medicamento: Medicamento) {
    limparMensagens()
    setIdEdicao(medicamento.medicamento_id)
    setNome(medicamento.nome_medicamento)
    campoNome.current?.focus()
  }

  function atualizarLista() {
    setIdExclusao(undefined)
    setErroExclusao('')
    setRevisao((atual) => atual + 1)
  }

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (ocupado) return
    limparMensagens()

    const erro = validarNome(nome)
    if (erro) {
      setErroNome(erro)
      campoNome.current?.focus()
      return
    }

    setOcupado(true)
    try {
      await salvarMedicamento(nome, idEdicao)
      limparFormulario()
      atualizarLista()
      setSucesso({
        mensagem: editando
          ? 'Medicamento atualizado.'
          : 'Medicamento cadastrado.',
      })
    } catch (error) {
      if (error instanceof MedicamentoApiError) {
        if (error.erroNome) setErroNome(error.erroNome)
        else setErroGeral(error.message)
        if (editando && error.status === 404) {
          setIdEdicao(undefined)
          atualizarLista()
        }
      } else {
        setErroGeral('Não foi possível conectar ao servidor.')
      }
    } finally {
      setOcupado(false)
    }
  }

  async function confirmarExclusao(id: number) {
    if (ocupado) return
    limparMensagens()
    setErroExclusao('')
    setOcupado(true)
    try {
      await excluirMedicamento(id)
      if (idEdicao === id) limparFormulario()
      atualizarLista()
      setSucesso({ mensagem: 'Medicamento excluído.' })
    } catch (error) {
      if (error instanceof MedicamentoApiError && error.status === 404) {
        setErroGeral(error.message)
        if (idEdicao === id) setIdEdicao(undefined)
        atualizarLista()
      } else {
        setErroExclusao(
          error instanceof MedicamentoApiError
            ? error.message
            : 'Não foi possível conectar ao servidor.',
        )
      }
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="form-stack">
      {erroGeral && (
        <div className="alert alert-error" role="alert">
          {erroGeral}
        </div>
      )}

      <section className="list-card" aria-labelledby="medicamento-form-title">
        <div className="list-header">
          <h2 id="medicamento-form-title">
            {editando ? 'Editar medicamento' : 'Cadastrar medicamento'}
          </h2>
        </div>
        <form className="form-body form-stack" onSubmit={enviar} noValidate>
          <div className="field">
            <label htmlFor="nome_medicamento">Nome do medicamento</label>
            <textarea
              ref={campoNome}
              id="nome_medicamento"
              name="nome_medicamento"
              rows={2}
              required
              value={nome}
              disabled={ocupado}
              onChange={(event) => {
                setNome(event.target.value)
                setErroNome('')
              }}
              aria-invalid={Boolean(erroNome)}
              aria-describedby={
                erroNome ? 'nome-medicamento-erro' : 'nome-medicamento-ajuda'
              }
            />
            {erroNome ? (
              <span
                id="nome-medicamento-erro"
                className="field-error"
                role="alert"
              >
                {erroNome}
              </span>
            ) : (
              <small id="nome-medicamento-ajuda">Até 200 caracteres.</small>
            )}
          </div>
          <div className="form-actions medicamento-actions">
            {editando && (
              <button
                type="button"
                className="btn-secondary"
                disabled={ocupado}
                onClick={() => {
                  limparFormulario()
                  limparMensagens()
                }}
              >
                Cancelar edição
              </button>
            )}
            <button type="submit" className="btn-primary" disabled={ocupado}>
              {editando ? 'Salvar alterações' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </section>

      <Lista
        key={revisao}
        resource="medicamento"
        responseKey="medicamentos"
        title="Medicamentos cadastrados"
        emptyMessage="Nenhum medicamento cadastrado."
        rowKey={(row) => row.medicamento_id}
        columns={[
          {
            title: 'Medicamento',
            render: (row) => (
              <span className="medicamento-nome">{row.nome_medicamento}</span>
            ),
          },
          {
            title: 'Ações',
            className: 'medicamento-coluna-acoes',
            render: (row) => (
              <div className="medicamento-actions">
                {idExclusao === row.medicamento_id ? (
                  <>
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={ocupado}
                      onClick={() => setIdExclusao(undefined)}
                    >
                      Cancelar exclusão
                    </button>
                    <button
                      type="button"
                      className="btn-danger-ghost"
                      disabled={ocupado}
                      onClick={() => confirmarExclusao(row.medicamento_id)}
                    >
                      Confirmar exclusão
                    </button>
                    {erroExclusao && (
                      <span
                        className="field-error medicamento-erro-exclusao"
                        role="alert"
                      >
                        {erroExclusao}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={ocupado}
                      aria-label={`Editar ${row.nome_medicamento}`}
                      onClick={() => iniciarEdicao(row)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn-danger-ghost"
                      disabled={ocupado}
                      aria-label={`Excluir ${row.nome_medicamento}`}
                      onClick={() => {
                        limparMensagens()
                        setErroExclusao('')
                        setIdExclusao(row.medicamento_id)
                      }}
                    >
                      Excluir
                    </button>
                  </>
                )}
              </div>
            ),
          },
        ]}
      />
      <div className="medicamento-notificacao" role="status">
        {sucesso && (
          <div className="alert alert-success">{sucesso.mensagem}</div>
        )}
      </div>
    </div>
  )
}
