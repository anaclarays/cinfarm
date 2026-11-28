import { Plus, Search, SlidersHorizontal } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import {
  EstabelecimentoApiError,
  atualizarEstabelecimento,
  criarEstabelecimento,
  excluirEstabelecimento,
  tiposAtendimento,
} from '../api/estabelecimento'
import type {
  Estabelecimento,
  EstabelecimentoDados,
} from '../api/estabelecimento'
import { Lista } from '../components/Lista'
import './Estabelecimentos.css'

type Campo = keyof EstabelecimentoDados
type Formulario = Record<Campo, string>

const campos = {
  nome: { label: 'Nome', limite: 200, obrigatorio: true },
  tipo_atendimento: {
    label: 'Tipo de atendimento',
    limite: 10,
    obrigatorio: true,
  },
  logradouro: { label: 'Logradouro', limite: 200, obrigatorio: true },
  numero: { label: 'Número', limite: 10, obrigatorio: false },
  complemento: { label: 'Complemento', limite: 100, obrigatorio: false },
  bairro: { label: 'Bairro', limite: 100, obrigatorio: true },
  cidade: { label: 'Cidade', limite: 100, obrigatorio: true },
  estado: { label: 'UF', limite: 2, obrigatorio: true },
  cep: { label: 'CEP', limite: 8, obrigatorio: true },
}
const nomesDosCampos = Object.keys(campos) as Campo[]
const filtros = ['nome', 'cidade', 'estado', 'tipo_atendimento'] as const
const ufs =
  'AC AL AM AP BA CE DF ES GO MA MG MS MT PA PB PE PI PR RJ RN RO RR RS SC SE SP TO'.split(
    ' ',
  )
const opcoesEstado = ufs.map((uf) => (
  <option key={uf} value={uf}>
    {uf}
  </option>
))
const opcoesAtendimento = Object.entries(tiposAtendimento).map(
  ([value, label]) => (
    <option key={value} value={value}>
      {label}
    </option>
  ),
)

function lerCep(input: HTMLInputElement) {
  const texto = input.value
  const cep = texto.replace(/\D/g, '').slice(0, campos.cep.limite)
  if (texto !== cep) {
    const antesDoCursor = texto.slice(0, input.selectionStart ?? texto.length)
    const cursor = antesDoCursor.replace(/\D/g, '').length
    input.value = cep
    input.setSelectionRange(cursor, cursor)
  }
  return cep
}

function validar(campo: Campo, valor: string) {
  const { obrigatorio, limite } = campos[campo]
  if (valor === '') return obrigatorio ? 'Campo obrigatório.' : undefined
  const somenteEspacos = [...valor].every(
    (caractere) =>
      /\p{White_Space}/u.test(caractere) ||
      (caractere >= '\u001c' && caractere <= '\u001f'),
  )
  if (somenteEspacos || valor.includes('\0'))
    return 'Informe um texto não vazio e válido.'
  if ([...valor].length > limite) return `Use no máximo ${limite} caracteres.`
  if (campo === 'tipo_atendimento' && !Object.hasOwn(tiposAtendimento, valor)) {
    return 'Selecione Público ou Privado.'
  }
  if (campo === 'cep' && !/^[0-9]{8}$/.test(valor)) {
    return 'Informe os 8 dígitos do CEP.'
  }
  if (campo === 'estado' && !/^[a-zA-Z]{2}$/.test(valor)) {
    return 'Informe a sigla do estado com 2 letras (ex.: PE).'
  }
}

function montarDados(valores: Formulario): EstabelecimentoDados {
  return {
    ...valores,
    tipo_atendimento:
      valores.tipo_atendimento as EstabelecimentoDados['tipo_atendimento'],
    numero: valores.numero || null,
    complemento: valores.complemento || null,
    estado: valores.estado.toUpperCase(),
  }
}

type Acao =
  { tipo: 'criar' } | { tipo: 'editar' | 'excluir'; registro: Estabelecimento }

export function Estabelecimentos({
  title,
  description,
}: {
  title: string
  description: string
}) {
  const [acao, setAcao] = useState<Acao | null>(null)
  const [query, setQuery] = useState('')
  const [revisao, setRevisao] = useState(0)
  const [sucesso, setSucesso] = useState<{ mensagem: string } | null>(null)
  const botaoNovo = useRef<HTMLButtonElement>(null)
  const botaoAcao = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (acao || !botaoAcao.current) return
    const botao = botaoAcao.current.isConnected
      ? botaoAcao.current
      : botaoNovo.current
    botao?.focus()
    botaoAcao.current = null
  }, [acao])

  useEffect(() => {
    if (!sucesso) return
    const timeout = window.setTimeout(() => setSucesso(null), 2000)
    return () => window.clearTimeout(timeout)
  }, [sucesso])

  function abrir(proximaAcao: Acao, botao: HTMLButtonElement) {
    botaoAcao.current = botao
    setAcao(proximaAcao)
  }

  function concluir(mensagem: string) {
    setAcao(null)
    setSucesso({ mensagem })
    setRevisao((valor) => valor + 1)
  }

  function aplicarFiltros(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const dados = new FormData(event.currentTarget)
    const params = new URLSearchParams()
    for (const campo of filtros) {
      const valor = String(dados.get(campo) ?? '')
      if (valor) params.set(campo, valor)
    }
    setQuery(params.toString())
    setRevisao((valor) => valor + 1)
  }

  return (
    <div className="form-stack estabelecimentos-controle">
      <header className="page-header estabelecimento-cabecalho">
        <h1>{title}</h1>
        <button
          ref={botaoNovo}
          className="btn-primary"
          type="button"
          aria-haspopup="dialog"
          onClick={(event) => abrir({ tipo: 'criar' }, event.currentTarget)}
        >
          <Plus size={18} aria-hidden="true" />
          Novo estabelecimento
        </button>
        <p>{description}</p>
      </header>
      {acao && (
        <ModalEstabelecimento
          acao={acao}
          cancelar={() => setAcao(null)}
          concluir={concluir}
        />
      )}
      <form
        className="list-card form-body estabelecimento-filtros"
        aria-labelledby="estabelecimento-filtros"
        onSubmit={aplicarFiltros}
        onReset={() => setQuery('')}
      >
        <h2 id="estabelecimento-filtros">
          <SlidersHorizontal size={18} aria-hidden="true" />
          Filtros
        </h2>
        {filtros.map((campo) => (
          <div key={campo} className="field">
            <label htmlFor={`filtro-${campo}`}>{campos[campo].label}</label>
            {campo === 'tipo_atendimento' || campo === 'estado' ? (
              <select id={`filtro-${campo}`} name={campo}>
                <option value="">
                  {campo === 'estado' ? 'Todas' : 'Todos'}
                </option>
                {campo === 'estado' ? opcoesEstado : opcoesAtendimento}
              </select>
            ) : (
              <input id={`filtro-${campo}`} name={campo} />
            )}
          </div>
        ))}
        <div className="estabelecimento-acoes">
          <button className="btn-secondary" type="submit">
            <Search size={16} aria-hidden="true" /> Filtrar
          </button>
          <button className="btn-secondary" type="reset">
            Limpar
          </button>
        </div>
      </form>
      {sucesso && (
        <div
          className="alert alert-success estabelecimento-notificacao"
          role="status"
        >
          {sucesso.mensagem}
        </div>
      )}
      <Lista
        key={`${query}:${revisao}`}
        resource="estabelecimento"
        responseKey="estabelecimentos"
        query={query}
        title="Estabelecimentos cadastrados"
        emptyMessage={
          query
            ? 'Nenhum estabelecimento corresponde aos filtros.'
            : 'Nenhum estabelecimento cadastrado.'
        }
        rowKey={(row) => row.estabelecimento_id}
        columns={[
          { title: 'Nome', render: (row) => row.nome },
          {
            title: 'Atendimento',
            render: (row) => (
              <span className="tag">
                {tiposAtendimento[row.tipo_atendimento]}
              </span>
            ),
          },
          {
            title: 'Endereço',
            render: (row) => (
              <>
                {[row.logradouro, row.numero, row.complemento, row.bairro]
                  .filter(Boolean)
                  .join(', ')}
                <span className="estabelecimento-cep">CEP {row.cep}</span>
              </>
            ),
          },
          {
            title: 'Cidade / UF',
            render: (row) => `${row.cidade} / ${row.estado}`,
          },
          {
            title: 'Ações',
            render: (row) => (
              <div className="estabelecimento-acoes estabelecimento-acoes-registro">
                <button
                  className="btn-secondary"
                  type="button"
                  aria-haspopup="dialog"
                  aria-label={`Editar ${row.nome}`}
                  onClick={(event) =>
                    abrir(
                      { tipo: 'editar', registro: row },
                      event.currentTarget,
                    )
                  }
                >
                  Editar
                </button>
                <button
                  className="btn-danger-ghost"
                  type="button"
                  aria-haspopup="dialog"
                  aria-label={`Excluir ${row.nome}`}
                  onClick={(event) =>
                    abrir(
                      { tipo: 'excluir', registro: row },
                      event.currentTarget,
                    )
                  }
                >
                  Excluir
                </button>
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}

type AcoesPainel = {
  cancelar: () => void
  concluir: (mensagem: string) => void
}

type EstadoModal = {
  ocupado: boolean
  setOcupado: (valor: boolean) => void
}

function ModalEstabelecimento({
  acao,
  cancelar,
  concluir,
}: AcoesPainel & { acao: Acao }) {
  const [ocupado, setOcupado] = useState(false)
  const dialogo = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const elemento = dialogo.current
    if (!elemento) return
    elemento.showModal()
    return () => elemento.close()
  }, [])

  const titulos = {
    criar: 'Novo estabelecimento',
    editar: 'Editar estabelecimento',
    excluir: 'Excluir estabelecimento',
  }
  const acoes = { cancelar, concluir, ocupado, setOcupado }

  return (
    <dialog
      ref={dialogo}
      className={`list-card estabelecimento-modal${acao.tipo === 'excluir' ? ' estabelecimento-modal-confirmacao' : ''}`}
      aria-labelledby="estabelecimento-acao"
      aria-describedby={
        acao.tipo === 'excluir' ? 'estabelecimento-confirmacao' : undefined
      }
      onCancel={(event) => {
        event.preventDefault()
        if (!ocupado) cancelar()
      }}
    >
      <div className="list-header">
        <h2 id="estabelecimento-acao">{titulos[acao.tipo]}</h2>
      </div>
      {acao.tipo === 'excluir' ? (
        <ConfirmarExclusao {...acoes} registro={acao.registro} />
      ) : (
        <FormularioEstabelecimento
          {...acoes}
          registro={acao.tipo === 'editar' ? acao.registro : undefined}
        />
      )}
    </dialog>
  )
}

function FormularioEstabelecimento({
  registro,
  cancelar,
  concluir,
  ocupado: salvando,
  setOcupado: setSalvando,
}: AcoesPainel & EstadoModal & { registro?: Estabelecimento }) {
  const [valores, setValores] = useState<Formulario>(
    () =>
      Object.fromEntries(
        nomesDosCampos.map((campo) => [campo, registro?.[campo] ?? '']),
      ) as Formulario,
  )
  const [erros, setErros] = useState<Partial<Record<Campo, string>>>({})
  const [mensagem, setMensagem] = useState('')

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (salvando) return

    const camposEditados = registro
      ? nomesDosCampos.filter(
          (campo) => valores[campo] !== (registro[campo] ?? ''),
        )
      : nomesDosCampos
    const errosLocais: typeof erros = {}
    for (const campo of camposEditados) {
      const erro = validar(campo, valores[campo])
      if (erro) errosLocais[campo] = erro
    }
    setErros(errosLocais)
    if (Object.keys(errosLocais).length) {
      setMensagem('Revise os campos destacados.')
      const primeiro = Object.keys(errosLocais)[0]
      event.currentTarget
        .querySelector<HTMLElement>(`#estabelecimento-${primeiro}`)
        ?.focus()
      return
    }

    const dados = montarDados(valores)
    const alteracoes = registro
      ? Object.fromEntries(
          camposEditados
            .filter((campo) => dados[campo] !== registro[campo])
            .map((campo) => [campo, dados[campo]]),
        )
      : dados
    if (!Object.keys(alteracoes).length) {
      setMensagem('Altere um campo antes de salvar.')
      return
    }

    setSalvando(true)
    setMensagem('')
    try {
      if (registro) {
        await atualizarEstabelecimento(registro.estabelecimento_id, alteracoes)
        concluir('Estabelecimento atualizado com sucesso.')
      } else {
        await criarEstabelecimento(dados)
        concluir('Estabelecimento cadastrado com sucesso.')
      }
    } catch (erro) {
      if (erro instanceof EstabelecimentoApiError) {
        setErros(erro.errors ?? {})
        setMensagem(erro.message)
      } else {
        setMensagem('Não foi possível conectar ao servidor.')
      }
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form className="form-body form-stack" noValidate onSubmit={salvar}>
      {mensagem && (
        <div className="alert alert-error" role="alert">
          {mensagem}
        </div>
      )}
      <fieldset
        className="form-grid form-grid-3 estabelecimento-campos"
        disabled={salvando}
      >
        {nomesDosCampos.map((campo) => {
          const { label, obrigatorio } = campos[campo]
          const id = `estabelecimento-${campo}`
          const erro = erros[campo]
          const props = {
            id,
            name: campo,
            required: obrigatorio,
            value: valores[campo],
            'aria-invalid': !!erro,
            'aria-describedby':
              [campo === 'cep' && `${id}-ajuda`, erro && `${id}-erro`]
                .filter(Boolean)
                .join(' ') || undefined,
            onChange: (
              event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
            ) => {
              const value =
                campo === 'cep'
                  ? lerCep(event.currentTarget as HTMLInputElement)
                  : event.currentTarget.value
              setValores((anterior) => ({ ...anterior, [campo]: value }))
              setErros((anterior) => ({ ...anterior, [campo]: undefined }))
            },
          }
          return (
            <div
              className={`field${campo === 'nome' || campo === 'logradouro' ? ' estabelecimento-campo-largo' : ''}`}
              key={campo}
            >
              <label htmlFor={id}>
                {label}
                {obrigatorio ? '' : ' (opcional)'}
              </label>
              {campo === 'tipo_atendimento' || campo === 'estado' ? (
                <select {...props}>
                  <option value="">Selecione</option>
                  {campo === 'estado' &&
                    registro?.estado &&
                    !ufs.includes(registro.estado) && (
                      <option value={registro.estado} disabled>
                        {registro.estado} (UF cadastrada)
                      </option>
                    )}
                  {campo === 'estado' ? opcoesEstado : opcoesAtendimento}
                </select>
              ) : (
                <input
                  {...props}
                  inputMode={campo === 'cep' ? 'numeric' : undefined}
                  autoComplete={campo === 'cep' ? 'postal-code' : undefined}
                />
              )}
              {campo === 'cep' && (
                <small id={`${id}-ajuda`}>8 dígitos, sem pontuação</small>
              )}
              {erro && (
                <span id={`${id}-erro`} className="field-error">
                  {erro}
                </span>
              )}
            </div>
          )
        })}
      </fieldset>
      <div className="form-actions estabelecimento-acoes">
        <button
          className="btn-secondary"
          type="button"
          disabled={salvando}
          onClick={cancelar}
        >
          Cancelar
        </button>
        <button className="btn-primary" type="submit" disabled={salvando}>
          {salvando
            ? 'Salvando…'
            : registro
              ? 'Salvar alterações'
              : 'Cadastrar estabelecimento'}
        </button>
      </div>
    </form>
  )
}

function ConfirmarExclusao({
  registro,
  cancelar,
  concluir,
  ocupado: excluindo,
  setOcupado: setExcluindo,
}: AcoesPainel & EstadoModal & { registro: Estabelecimento }) {
  const [mensagem, setMensagem] = useState('')

  async function excluir() {
    setExcluindo(true)
    setMensagem('')
    try {
      await excluirEstabelecimento(registro.estabelecimento_id)
      concluir('Estabelecimento excluído com sucesso.')
    } catch (erro) {
      setMensagem(
        erro instanceof EstabelecimentoApiError
          ? erro.message
          : 'Não foi possível conectar ao servidor.',
      )
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <div className="form-body form-stack">
      <p
        className="estabelecimento-confirmacao"
        id="estabelecimento-confirmacao"
      >
        Deseja excluir <strong>{registro.nome}</strong>?
      </p>
      {mensagem && (
        <div className="alert alert-error" role="alert">
          {mensagem}
        </div>
      )}
      <div className="form-actions estabelecimento-acoes">
        <button
          className="btn-secondary"
          type="button"
          disabled={excluindo}
          onClick={cancelar}
        >
          Cancelar
        </button>
        <button
          className="estabelecimento-excluir"
          type="button"
          disabled={excluindo}
          onClick={excluir}
        >
          {excluindo ? 'Excluindo…' : 'Confirmar exclusão'}
        </button>
      </div>
    </div>
  )
}
