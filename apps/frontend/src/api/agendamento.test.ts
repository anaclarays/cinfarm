import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AgendamentoApiError,
  type AgendamentoCriado,
  type CriarAgendamentoPayload,
  criarAgendamento,
} from "./agendamento";

const payloadBase: CriarAgendamentoPayload = {
  paciente_cpf: "12345678901",
  profissional_saude_cpf: "98765432100",
  data_hora_prevista: "2026-11-25T14:30:00",
  status: "agendado",
  observacoes: "Paciente em acompanhamento.",
  medicoes_clinicas: [
    {
      profissional_saude_cpf: "98765432100",
      valor: "120/80",
      data_medicao: "2026-11-25",
      hora_medicao: "14:45:00",
      tipo_parametro: {
        tipo: "Pressão Arterial",
        unidade_medida: "mmHg",
        faixa_referencia: "120/80",
      },
    },
  ],
};

describe("criarAgendamento", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("envia POST para /api/agendamento/ e retorna o agendamento criado (201)", async () => {
    const respostaEsperada: AgendamentoCriado = {
      agendamento_id: 42,
      paciente_cpf: payloadBase.paciente_cpf,
      profissional_saude_cpf: payloadBase.profissional_saude_cpf,
      data_hora_prevista: payloadBase.data_hora_prevista,
      status: payloadBase.status,
      observacoes: payloadBase.observacoes ?? null,
      medicoes_clinicas: [
        {
          medicao_id: 1,
          agendamento_id: 42,
          parametro_id: 1,
          profissional_saude_cpf: "98765432100",
          valor: "120/80",
          data_medicao: "2026-11-25",
          hora_medicao: "14:45:00",
          tipo_parametro: {
            parametro_id: 1,
            tipo: "Pressão Arterial",
            unidade_medida: "mmHg",
            faixa_referencia: "120/80",
          },
        },
      ],
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => respostaEsperada,
    });
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await criarAgendamento(payloadBase);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/agendamento/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payloadBase),
    });
    expect(resultado).toEqual(respostaEsperada);
  });

  it("lança AgendamentoApiError preservando errors no 400", async () => {
    const errors = {
      paciente_cpf: ["Informe o CPF com 11 dígitos."],
      medicoes_clinicas: {
        0: {
          tipo_parametro: {
            tipo: ["Informe um texto válido."],
          },
        },
      },
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ errors }),
      }),
    );

    await expect(criarAgendamento(payloadBase)).rejects.toMatchObject({
      name: "AgendamentoApiError",
      status: 400,
      message: "Verifique os campos destacados e tente novamente.",
      errors,
    });
  });

  it.each([
    [404, "Paciente não encontrado."],
    [409, "Um vínculo dos dados informados deixou de ser válido."],
  ])("usa a mensagem do servidor no status %i", async (status, error) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status,
        json: async () => ({ error }),
      }),
    );

    const promise = criarAgendamento(payloadBase);
    await expect(promise).rejects.toBeInstanceOf(AgendamentoApiError);
    await expect(promise).rejects.toMatchObject({
      status,
      message: error,
      errors: undefined,
    });
  });

  it("usa mensagem padrão HTTP quando a resposta de erro não tem JSON (500)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => {
          throw new SyntaxError("Unexpected token");
        },
      }),
    );

    const promise = criarAgendamento(payloadBase);
    await expect(promise).rejects.toBeInstanceOf(AgendamentoApiError);
    await expect(promise).rejects.toMatchObject({
      status: 500,
      message: "Erro ao criar agendamento (HTTP 500).",
      errors: undefined,
    });
  });

  it("propaga falha de rede original sem encapsular em AgendamentoApiError", async () => {
    const networkError = new TypeError("Failed to fetch");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(networkError));

    const promise = criarAgendamento(payloadBase);
    await expect(promise).rejects.toBe(networkError);
    await expect(promise).rejects.not.toBeInstanceOf(AgendamentoApiError);
  });
});
