import { AlertCircle, CheckCircle2, Plus, Trash2 } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import {
  AgendamentoApiError,
  type ApiFieldErrors,
  type CriarAgendamentoPayload,
  criarAgendamento,
} from '../api/agendamento'

type MedicaoForm = {
  id: number
  profissional_saude_cpf: string
  valor: string
  data_medicao: string
  hora_medicao: string
  tipo: string
  unidade_medida: string
  faixa_referencia: string
}

type FormState = {
  paciente_cpf: string
  profissional_saude_cpf: string
  data_hora_prevista: string
  status: string
  observacoes: string
  medicoes_clinicas: MedicaoForm[]
}

let nextMedicaoId = 1

function criarMedicaoVazia(): MedicaoForm {
  return {
    id: nextMedicaoId++,
    profissional_saude_cpf: '',
    valor: '',
    data_medicao: '',
    hora_medicao: '',
    tipo: '',
    unidade_medida: '',
    faixa_referencia: '',
  }
}

function criarEstadoInicial(): FormState {
  return {
    paciente_cpf: '',
    profissional_saude_cpf: '',
    data_hora_prevista: '',
    status: 'agendado',
    observacoes: '',
    medicoes_clinicas: [criarMedicaoVazia()],
  }
}

const CPF_REGEX = /^[0-9]{11}$/

function isBlank(value: string): boolean {
  return value.trim().length === 0
}

function normalizarDataHora(value: string): string {
  return value.length === 16 ? `${value}:00` : value
}

function normalizarHora(value: string): string {
  return value.length === 5 ? `${value}:00` : value
}

function extrairErrosApi(
  errors: ApiFieldErrors,
  prefix = '',
): Record<string, string> {
  const result: Record<string, string> = {}

  for (const [key, value] of Object.entries(errors)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (Array.isArray(value)) {
      const messages = value.filter(
        (item): item is string => typeof item === 'string',
      )
      if (messages.length > 0) {
        result[path] = messages.join(' ')
      }
    } else if (value && typeof value === 'object') {
      Object.assign(result, extrairErrosApi(value as ApiFieldErrors, path))
    }
  }

  return result
}

function validarFormulario(form: FormState): Record<string, string> {
  const erros: Record<string, string> = {}

  if (!CPF_REGEX.test(form.paciente_cpf)) {
    erros.paciente_cpf = 'Informe o CPF do paciente com 11 dígitos.'
  }

  if (!CPF_REGEX.test(form.profissional_saude_cpf)) {
    erros.profissional_saude_cpf =
      'Informe o CPF do profissional responsável com 11 dígitos.'
  }

  if (isBlank(form.data_hora_prevista)) {
    erros.data_hora_prevista = 'Informe a data e hora prevista.'
  }

  if (isBlank(form.status)) {
    erros.status = 'Informe o status do agendamento.'
  } else if (form.status.length > 50) {
    erros.status = 'O status deve ter no máximo 50 caracteres.'
  }

  if (form.observacoes.length > 2000) {
    erros.observacoes = 'As observações devem ter no máximo 2000 caracteres.'
  }

  if (form.medicoes_clinicas.length < 1) {
    erros.medicoes_clinicas = 'Informe pelo menos uma medição clínica.'
  }

  form.medicoes_clinicas.forEach((medicao, index) => {
    const base = `medicoes_clinicas.${index}`

    if (!CPF_REGEX.test(medicao.profissional_saude_cpf)) {
      erros[`${base}.profissional_saude_cpf`] =
        'Informe o CPF do profissional com 11 dígitos.'
    }

    if (isBlank(medicao.valor)) {
      erros[`${base}.valor`] = 'Informe o valor da medição.'
    } else if (medicao.valor.length > 200) {
      erros[`${base}.valor`] = 'O valor deve ter no máximo 200 caracteres.'
    }

    if (isBlank(medicao.data_medicao)) {
      erros[`${base}.data_medicao`] = 'Informe a data da medição.'
    }

    if (isBlank(medicao.hora_medicao)) {
      erros[`${base}.hora_medicao`] = 'Informe a hora da medição.'
    }

    if (isBlank(medicao.tipo)) {
      erros[`${base}.tipo_parametro.tipo`] = 'Informe o tipo do parâmetro.'
    } else if (medicao.tipo.length > 200) {
      erros[`${base}.tipo_parametro.tipo`] =
        'O tipo deve ter no máximo 200 caracteres.'
    }

    if (isBlank(medicao.unidade_medida)) {
      erros[`${base}.tipo_parametro.unidade_medida`] =
        'Informe a unidade de medida.'
    } else if (medicao.unidade_medida.length > 100) {
      erros[`${base}.tipo_parametro.unidade_medida`] =
        'A unidade de medida deve ter no máximo 100 caracteres.'
    }

    if (isBlank(medicao.faixa_referencia)) {
      erros[`${base}.tipo_parametro.faixa_referencia`] =
        'Informe a faixa de referência.'
    } else if (medicao.faixa_referencia.length > 200) {
      erros[`${base}.tipo_parametro.faixa_referencia`] =
        'A faixa de referência deve ter no máximo 200 caracteres.'
    }
  })

  return erros
}

export function RealizarAgendamento() {
  const [form, setForm] = useState<FormState>(criarEstadoInicial)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function atualizarCampo<K extends keyof Omit<FormState, 'medicoes_clinicas'>>(
    campo: K,
    valor: FormState[K],
  ) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
    setFieldErrors((atual) => {
      if (!atual[campo]) return atual
      const proximo = { ...atual }
      delete proximo[campo]
      return proximo
    })
  }

  function atualizarMedicao(
    index: number,
    campo: keyof Omit<MedicaoForm, 'id'>,
    valor: string,
  ) {
    setForm((atual) => ({
      ...atual,
      medicoes_clinicas: atual.medicoes_clinicas.map((item, i) =>
        i === index ? { ...item, [campo]: valor } : item,
      ),
    }))

    const errorKey =
      campo === 'tipo' ||
      campo === 'unidade_medida' ||
      campo === 'faixa_referencia'
        ? `medicoes_clinicas.${index}.tipo_parametro.${campo}`
        : `medicoes_clinicas.${index}.${campo}`

    setFieldErrors((atual) => {
      if (!atual[errorKey]) return atual
      const proximo = { ...atual }
      delete proximo[errorKey]
      return proximo
    })
  }

  function adicionarMedicao() {
    setForm((atual) => ({
      ...atual,
      medicoes_clinicas: [...atual.medicoes_clinicas, criarMedicaoVazia()],
    }))
    setFieldErrors((atual) => {
      if (!atual.medicoes_clinicas) return atual
      const proximo = { ...atual }
      delete proximo.medicoes_clinicas
      return proximo
    })
  }

  function removerMedicao(index: number) {
    if (form.medicoes_clinicas.length <= 1) return
    setForm((atual) => ({
      ...atual,
      medicoes_clinicas: atual.medicoes_clinicas.filter((_, i) => i !== index),
    }))
    setFieldErrors({})
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSucesso(null)
    setErroGeral(null)

    const errosLocais = validarFormulario(form)
    if (Object.keys(errosLocais).length > 0) {
      setFieldErrors(errosLocais)
      setErroGeral('Corrija os campos destacados antes de enviar.')
      return
    }

    const payload: CriarAgendamentoPayload = {
      paciente_cpf: form.paciente_cpf.trim(),
      profissional_saude_cpf: form.profissional_saude_cpf.trim(),
      data_hora_prevista: normalizarDataHora(form.data_hora_prevista),
      status: form.status,
      medicoes_clinicas: form.medicoes_clinicas.map((m) => ({
        profissional_saude_cpf: m.profissional_saude_cpf.trim(),
        valor: m.valor,
        data_medicao: m.data_medicao,
        hora_medicao: normalizarHora(m.hora_medicao),
        tipo_parametro: {
          tipo: m.tipo,
          unidade_medida: m.unidade_medida,
          faixa_referencia: m.faixa_referencia,
        },
      })),
    }

    if (!isBlank(form.observacoes)) {
      payload.observacoes = form.observacoes
    }

    setSubmitting(true)
    setFieldErrors({})

    try {
      const criado = await criarAgendamento(payload)
      setForm(criarEstadoInicial())
      setSucesso(
        `Agendamento #${criado.agendamento_id} realizado com sucesso.`,
      )
    } catch (error) {
      if (error instanceof AgendamentoApiError) {
        setErroGeral(error.message)
        if (error.errors) {
          setFieldErrors(extrairErrosApi(error.errors))
        }
      } else {
        setErroGeral('Não foi possível conectar ao servidor.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit} noValidate>
      {sucesso && (
        <div className="alert alert-success" role="status">
          <CheckCircle2 size={18} aria-hidden="true" />
          <span>{sucesso}</span>
        </div>
      )}

      {erroGeral && (
        <div className="alert alert-error" role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          <span>{erroGeral}</span>
        </div>
      )}

      <section className="list-card">
        <div className="list-header">
          <h2>Dados do agendamento</h2>
        </div>

        <div className="form-body form-grid">
          <div className="field">
            <label htmlFor="paciente_cpf">CPF do paciente *</label>
            <input
              id="paciente_cpf"
              name="paciente_cpf"
              type="text"
              inputMode="numeric"
              maxLength={11}
              placeholder="Somente 11 dígitos"
              value={form.paciente_cpf}
              onChange={(e) => atualizarCampo('paciente_cpf', e.target.value)}
              aria-invalid={Boolean(fieldErrors.paciente_cpf)}
            />
            {fieldErrors.paciente_cpf && (
              <span className="field-error">{fieldErrors.paciente_cpf}</span>
            )}
          </div>

          <div className="field">
            <label htmlFor="profissional_saude_cpf">
              CPF do profissional responsável *
            </label>
            <input
              id="profissional_saude_cpf"
              name="profissional_saude_cpf"
              type="text"
              inputMode="numeric"
              maxLength={11}
              placeholder="Somente 11 dígitos"
              value={form.profissional_saude_cpf}
              onChange={(e) =>
                atualizarCampo('profissional_saude_cpf', e.target.value)
              }
              aria-invalid={Boolean(fieldErrors.profissional_saude_cpf)}
            />
            {fieldErrors.profissional_saude_cpf && (
              <span className="field-error">
                {fieldErrors.profissional_saude_cpf}
              </span>
            )}
          </div>

          <div className="field">
            <label htmlFor="data_hora_prevista">Data e hora prevista *</label>
            <input
              id="data_hora_prevista"
              name="data_hora_prevista"
              type="datetime-local"
              value={form.data_hora_prevista}
              onChange={(e) =>
                atualizarCampo('data_hora_prevista', e.target.value)
              }
              aria-invalid={Boolean(fieldErrors.data_hora_prevista)}
            />
            {fieldErrors.data_hora_prevista && (
              <span className="field-error">
                {fieldErrors.data_hora_prevista}
              </span>
            )}
          </div>

          <div className="field">
            <label htmlFor="status">Status *</label>
            <input
              id="status"
              name="status"
              type="text"
              maxLength={50}
              value={form.status}
              onChange={(e) => atualizarCampo('status', e.target.value)}
              aria-invalid={Boolean(fieldErrors.status)}
            />
            {fieldErrors.status && (
              <span className="field-error">{fieldErrors.status}</span>
            )}
          </div>

          <div className="field field-full">
            <label htmlFor="observacoes">Observações</label>
            <textarea
              id="observacoes"
              name="observacoes"
              rows={3}
              maxLength={2000}
              placeholder="Observações opcionais sobre o agendamento"
              value={form.observacoes}
              onChange={(e) => atualizarCampo('observacoes', e.target.value)}
              aria-invalid={Boolean(fieldErrors.observacoes)}
            />
            {fieldErrors.observacoes && (
              <span className="field-error">{fieldErrors.observacoes}</span>
            )}
          </div>
        </div>
      </section>

      <section className="list-card">
        <div className="list-header">
          <h2>Medições clínicas</h2>
          <button
            type="button"
            className="btn-secondary"
            onClick={adicionarMedicao}
          >
            <Plus size={16} aria-hidden="true" />
            Adicionar medição
          </button>
        </div>

        <div className="form-body medicoes-list">
          {fieldErrors.medicoes_clinicas && (
            <span className="field-error">
              {fieldErrors.medicoes_clinicas}
            </span>
          )}

          {form.medicoes_clinicas.map((medicao, index) => {
            const base = `medicoes_clinicas.${index}`
            const errCpf = fieldErrors[`${base}.profissional_saude_cpf`]
            const errValor = fieldErrors[`${base}.valor`]
            const errData = fieldErrors[`${base}.data_medicao`]
            const errHora = fieldErrors[`${base}.hora_medicao`]
            const errTipo = fieldErrors[`${base}.tipo_parametro.tipo`]
            const errUnidade =
              fieldErrors[`${base}.tipo_parametro.unidade_medida`]
            const errFaixa =
              fieldErrors[`${base}.tipo_parametro.faixa_referencia`]

            return (
              <fieldset key={medicao.id} className="medicao-card">
                <div className="medicao-header">
                  <legend>Medição #{index + 1}</legend>
                  <button
                    type="button"
                    className="btn-danger-ghost"
                    onClick={() => removerMedicao(index)}
                    disabled={form.medicoes_clinicas.length <= 1}
                    title={
                      form.medicoes_clinicas.length <= 1
                        ? 'É obrigatório informar pelo menos uma medição clínica'
                        : 'Remover medição'
                    }
                  >
                    <Trash2 size={15} aria-hidden="true" />
                    Remover
                  </button>
                </div>

                <div className="form-grid">
                  <div className="field">
                    <label htmlFor={`medicao_${medicao.id}_cpf`}>
                      CPF do profissional executor *
                    </label>
                    <input
                      id={`medicao_${medicao.id}_cpf`}
                      type="text"
                      inputMode="numeric"
                      maxLength={11}
                      placeholder="Somente 11 dígitos"
                      value={medicao.profissional_saude_cpf}
                      onChange={(e) =>
                        atualizarMedicao(
                          index,
                          'profissional_saude_cpf',
                          e.target.value,
                        )
                      }
                      aria-invalid={Boolean(errCpf)}
                    />
                    {errCpf && <span className="field-error">{errCpf}</span>}
                  </div>

                  <div className="field">
                    <label htmlFor={`medicao_${medicao.id}_valor`}>
                      Valor *
                    </label>
                    <input
                      id={`medicao_${medicao.id}_valor`}
                      type="text"
                      maxLength={200}
                      placeholder="Ex.: 120/80"
                      value={medicao.valor}
                      onChange={(e) =>
                        atualizarMedicao(index, 'valor', e.target.value)
                      }
                      aria-invalid={Boolean(errValor)}
                    />
                    {errValor && (
                      <span className="field-error">{errValor}</span>
                    )}
                  </div>

                  <div className="field">
                    <label htmlFor={`medicao_${medicao.id}_data`}>
                      Data da medição *
                    </label>
                    <input
                      id={`medicao_${medicao.id}_data`}
                      type="date"
                      value={medicao.data_medicao}
                      onChange={(e) =>
                        atualizarMedicao(index, 'data_medicao', e.target.value)
                      }
                      aria-invalid={Boolean(errData)}
                    />
                    {errData && <span className="field-error">{errData}</span>}
                  </div>

                  <div className="field">
                    <label htmlFor={`medicao_${medicao.id}_hora`}>
                      Hora da medição *
                    </label>
                    <input
                      id={`medicao_${medicao.id}_hora`}
                      type="time"
                      value={medicao.hora_medicao}
                      onChange={(e) =>
                        atualizarMedicao(index, 'hora_medicao', e.target.value)
                      }
                      aria-invalid={Boolean(errHora)}
                    />
                    {errHora && <span className="field-error">{errHora}</span>}
                  </div>
                </div>

                <div className="parametro-box">
                  <h3>Tipo de parâmetro</h3>
                  <div className="form-grid form-grid-3">
                    <div className="field">
                      <label htmlFor={`medicao_${medicao.id}_tipo`}>
                        Tipo *
                      </label>
                      <input
                        id={`medicao_${medicao.id}_tipo`}
                        type="text"
                        maxLength={200}
                        placeholder="Ex.: Pressão Arterial"
                        value={medicao.tipo}
                        onChange={(e) =>
                          atualizarMedicao(index, 'tipo', e.target.value)
                        }
                        aria-invalid={Boolean(errTipo)}
                      />
                      {errTipo && (
                        <span className="field-error">{errTipo}</span>
                      )}
                    </div>

                    <div className="field">
                      <label htmlFor={`medicao_${medicao.id}_unidade`}>
                        Unidade de medida *
                      </label>
                      <input
                        id={`medicao_${medicao.id}_unidade`}
                        type="text"
                        maxLength={100}
                        placeholder="Ex.: mmHg"
                        value={medicao.unidade_medida}
                        onChange={(e) =>
                          atualizarMedicao(
                            index,
                            'unidade_medida',
                            e.target.value,
                          )
                        }
                        aria-invalid={Boolean(errUnidade)}
                      />
                      {errUnidade && (
                        <span className="field-error">{errUnidade}</span>
                      )}
                    </div>

                    <div className="field">
                      <label htmlFor={`medicao_${medicao.id}_faixa`}>
                        Faixa de referência *
                      </label>
                      <input
                        id={`medicao_${medicao.id}_faixa`}
                        type="text"
                        maxLength={200}
                        placeholder="Ex.: 120/80"
                        value={medicao.faixa_referencia}
                        onChange={(e) =>
                          atualizarMedicao(
                            index,
                            'faixa_referencia',
                            e.target.value,
                          )
                        }
                        aria-invalid={Boolean(errFaixa)}
                      />
                      {errFaixa && (
                        <span className="field-error">{errFaixa}</span>
                      )}
                    </div>
                  </div>
                </div>
              </fieldset>
            )
          })}
        </div>
      </section>

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Salvando agendamento...' : 'Realizar Agendamento'}
        </button>
      </div>
    </form>
  )
}
