import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AgendamentoApiError, criarAgendamento } from "../api/agendamento";
import { RealizarAgendamento } from "./RealizarAgendamento";

vi.mock("../api/agendamento", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/agendamento")>();
  return {
    ...actual,
    criarAgendamento: vi.fn(),
  };
});

const criarAgendamentoMock = vi.mocked(criarAgendamento);

function obterMedicoes(): HTMLElement[] {
  return screen.getAllByRole("group");
}

async function preencherCabecalho(
  user: ReturnType<typeof userEvent.setup>,
  dados?: {
    paciente_cpf?: string;
    profissional_saude_cpf?: string;
    data_hora_prevista?: string;
    status?: string;
    observacoes?: string;
  },
) {
  const pacienteInput = screen.getByLabelText("CPF do paciente *");
  const profInput = screen.getByLabelText("CPF do profissional responsável *");
  const dataHoraInput = screen.getByLabelText("Data e hora prevista *");
  const statusInput = screen.getByLabelText("Status *");
  const obsInput = screen.getByLabelText("Observações");

  await user.type(pacienteInput, dados?.paciente_cpf ?? "12345678901");
  await user.type(profInput, dados?.profissional_saude_cpf ?? "98765432100");
  fireEvent.change(dataHoraInput, {
    target: { value: dados?.data_hora_prevista ?? "2026-11-25T14:30" },
  });

  if (dados?.status !== undefined) {
    await user.clear(statusInput);
    if (dados.status !== "") {
      await user.type(statusInput, dados.status);
    }
  }

  if (dados?.observacoes !== undefined) {
    await user.type(obsInput, dados.observacoes);
  }
}

async function preencherMedicao(
  user: ReturnType<typeof userEvent.setup>,
  index: number,
  dados?: {
    profissional_saude_cpf?: string;
    valor?: string;
    data_medicao?: string;
    hora_medicao?: string;
    tipo?: string;
    unidade_medida?: string;
    faixa_referencia?: string;
  },
) {
  const medicao = obterMedicoes()[index];
  const scoped = within(medicao);

  await user.type(
    scoped.getByLabelText("CPF do profissional executor *"),
    dados?.profissional_saude_cpf ?? "98765432100",
  );
  await user.type(scoped.getByLabelText("Valor *"), dados?.valor ?? "120/80");
  fireEvent.change(scoped.getByLabelText("Data da medição *"), {
    target: { value: dados?.data_medicao ?? "2026-11-25" },
  });
  fireEvent.change(scoped.getByLabelText("Hora da medição *"), {
    target: { value: dados?.hora_medicao ?? "14:45" },
  });
  await user.type(
    scoped.getByLabelText("Tipo *"),
    dados?.tipo ?? "Pressão Arterial",
  );
  await user.type(
    scoped.getByLabelText("Unidade de medida *"),
    dados?.unidade_medida ?? "mmHg",
  );
  await user.type(
    scoped.getByLabelText("Faixa de referência *"),
    dados?.faixa_referencia ?? "120/80",
  );
}

describe("RealizarAgendamento", () => {
  beforeEach(() => {
    criarAgendamentoMock.mockReset();
  });

  it('inicia com status "agendado", 1 medição e botão Remover desabilitado', () => {
    render(<RealizarAgendamento />);

    expect(screen.getByLabelText("Status *")).toHaveValue("agendado");
    const medicoes = obterMedicoes();
    expect(medicoes).toHaveLength(1);
    expect(screen.getByText("Medição #1")).toBeInTheDocument();

    const removerBtn = within(medicoes[0]).getByRole("button", {
      name: /Remover/i,
    });
    expect(removerBtn).toBeDisabled();
  });

  it("permite adicionar e remover medições mantendo no mínimo 1", async () => {
    const user = userEvent.setup();
    render(<RealizarAgendamento />);

    await user.click(
      screen.getByRole("button", { name: /Adicionar medição/i }),
    );

    let medicoes = obterMedicoes();
    expect(medicoes).toHaveLength(2);
    expect(screen.getByText("Medição #2")).toBeInTheDocument();

    const removerBotoes = medicoes.map((m) =>
      within(m).getByRole("button", { name: /Remover/i }),
    );
    expect(removerBotoes[0]).toBeEnabled();
    expect(removerBotoes[1]).toBeEnabled();

    await user.click(removerBotoes[1]);

    medicoes = obterMedicoes();
    expect(medicoes).toHaveLength(1);
    expect(
      within(medicoes[0]).getByRole("button", { name: /Remover/i }),
    ).toBeDisabled();
  });

  it("bloqueia envio vazio exibindo todos os erros, alerta geral e aria-invalid", async () => {
    const user = userEvent.setup();
    render(<RealizarAgendamento />);

    await user.click(
      screen.getByRole("button", { name: /Realizar Agendamento/i }),
    );

    expect(criarAgendamentoMock).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Corrija os campos destacados antes de enviar.",
    );

    const mensagensEsperadas = [
      "Informe o CPF do paciente com 11 dígitos.",
      "Informe o CPF do profissional responsável com 11 dígitos.",
      "Informe a data e hora prevista.",
      "Informe o CPF do profissional com 11 dígitos.",
      "Informe o valor da medição.",
      "Informe a data da medição.",
      "Informe a hora da medição.",
      "Informe o tipo do parâmetro.",
      "Informe a unidade de medida.",
      "Informe a faixa de referência.",
    ];
    for (const msg of mensagensEsperadas) {
      expect(screen.getByText(msg)).toBeInTheDocument();
    }

    const labelsInvalidos = [
      "CPF do paciente *",
      "CPF do profissional responsável *",
      "Data e hora prevista *",
      "CPF do profissional executor *",
      "Valor *",
      "Data da medição *",
      "Hora da medição *",
      "Tipo *",
      "Unidade de medida *",
      "Faixa de referência *",
    ];
    for (const label of labelsInvalidos) {
      expect(screen.getByLabelText(label)).toHaveAttribute(
        "aria-invalid",
        "true",
      );
    }
  });

  it("bloqueia envio quando CPF tem 10 dígitos ou contém letra", async () => {
    const user = userEvent.setup();
    render(<RealizarAgendamento />);

    await preencherCabecalho(user, {
      paciente_cpf: "1234567890",
      profissional_saude_cpf: "1234567890a",
    });
    await preencherMedicao(user, 0, {
      profissional_saude_cpf: "abcdefghijk",
    });

    await user.click(
      screen.getByRole("button", { name: /Realizar Agendamento/i }),
    );

    expect(criarAgendamentoMock).not.toHaveBeenCalled();
    expect(
      screen.getByText("Informe o CPF do paciente com 11 dígitos."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Informe o CPF do profissional responsável com 11 dígitos.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Informe o CPF do profissional com 11 dígitos."),
    ).toBeInTheDocument();
  });

  it("valida limites máximos de tamanho em todos os campos de texto", async () => {
    const user = userEvent.setup();
    render(<RealizarAgendamento />);

    await preencherCabecalho(user);
    await preencherMedicao(user, 0);

    fireEvent.change(screen.getByLabelText("Status *"), {
      target: { value: "a".repeat(51) },
    });
    fireEvent.change(screen.getByLabelText("Observações"), {
      target: { value: "a".repeat(2001) },
    });
    fireEvent.change(screen.getByLabelText("Valor *"), {
      target: { value: "a".repeat(201) },
    });
    fireEvent.change(screen.getByLabelText("Tipo *"), {
      target: { value: "a".repeat(201) },
    });
    fireEvent.change(screen.getByLabelText("Unidade de medida *"), {
      target: { value: "a".repeat(101) },
    });
    fireEvent.change(screen.getByLabelText("Faixa de referência *"), {
      target: { value: "a".repeat(201) },
    });

    await user.click(
      screen.getByRole("button", { name: /Realizar Agendamento/i }),
    );

    expect(criarAgendamentoMock).not.toHaveBeenCalled();
    expect(
      screen.getByText("O status deve ter no máximo 50 caracteres."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("As observações devem ter no máximo 2000 caracteres."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("O valor deve ter no máximo 200 caracteres."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("O tipo deve ter no máximo 200 caracteres."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "A unidade de medida deve ter no máximo 100 caracteres.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "A faixa de referência deve ter no máximo 200 caracteres.",
      ),
    ).toBeInTheDocument();
  });

  it("rejeita status composto apenas por espaços em branco", async () => {
    const user = userEvent.setup();
    render(<RealizarAgendamento />);

    await preencherCabecalho(user, { status: "   " });
    await preencherMedicao(user, 0);

    await user.click(
      screen.getByRole("button", { name: /Realizar Agendamento/i }),
    );

    expect(criarAgendamentoMock).not.toHaveBeenCalled();
    expect(
      screen.getByText("Informe o status do agendamento."),
    ).toBeInTheDocument();
  });

  it("com 2 medições e só a primeira preenchida, exibe erro apenas na segunda", async () => {
    const user = userEvent.setup();
    render(<RealizarAgendamento />);

    await preencherCabecalho(user);
    await preencherMedicao(user, 0);
    await user.click(
      screen.getByRole("button", { name: /Adicionar medição/i }),
    );

    await user.click(
      screen.getByRole("button", { name: /Realizar Agendamento/i }),
    );

    expect(criarAgendamentoMock).not.toHaveBeenCalled();
    const [medicao1, medicao2] = obterMedicoes();

    expect(
      within(medicao1).queryByText("Informe o valor da medição."),
    ).not.toBeInTheDocument();
    expect(within(medicao1).getByLabelText("Valor *")).toHaveAttribute(
      "aria-invalid",
      "false",
    );

    expect(
      within(medicao2).getByText("Informe o valor da medição."),
    ).toBeInTheDocument();
    expect(within(medicao2).getByLabelText("Valor *")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("limpa o erro do campo ao digitar nele", async () => {
    const user = userEvent.setup();
    render(<RealizarAgendamento />);

    await user.click(
      screen.getByRole("button", { name: /Realizar Agendamento/i }),
    );
    expect(
      screen.getByText("Informe o CPF do paciente com 11 dígitos."),
    ).toBeInTheDocument();

    const pacienteInput = screen.getByLabelText("CPF do paciente *");
    await user.type(pacienteInput, "1");

    expect(
      screen.queryByText("Informe o CPF do paciente com 11 dígitos."),
    ).not.toBeInTheDocument();
    expect(pacienteInput).toHaveAttribute("aria-invalid", "false");
  });

  it("envia payload normalizado sem observacoes quando vazia/espaços e reseta após sucesso", async () => {
    const user = userEvent.setup();
    criarAgendamentoMock.mockResolvedValue({
      agendamento_id: 7,
      paciente_cpf: "12345678901",
      profissional_saude_cpf: "98765432100",
      data_hora_prevista: "2026-11-25T14:30:00",
      status: "agendado",
      observacoes: null,
      medicoes_clinicas: [],
    });

    render(<RealizarAgendamento />);
    await preencherCabecalho(user, { observacoes: "   " });
    await preencherMedicao(user, 0);

    await user.click(
      screen.getByRole("button", { name: /Realizar Agendamento/i }),
    );

    expect(criarAgendamentoMock).toHaveBeenCalledTimes(1);
    const enviado = criarAgendamentoMock.mock.calls[0][0];
    expect(enviado).toEqual({
      paciente_cpf: "12345678901",
      profissional_saude_cpf: "98765432100",
      data_hora_prevista: "2026-11-25T14:30:00",
      status: "agendado",
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
    });
    expect("observacoes" in enviado).toBe(false);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Agendamento #7 realizado com sucesso.",
    );
    expect(screen.getByLabelText("CPF do paciente *")).toHaveValue("");
    expect(screen.getByLabelText("Status *")).toHaveValue("agendado");
    expect(obterMedicoes()).toHaveLength(1);
  });

  it("inclui observacoes no payload quando preenchida", async () => {
    const user = userEvent.setup();
    criarAgendamentoMock.mockResolvedValue({
      agendamento_id: 8,
      paciente_cpf: "12345678901",
      profissional_saude_cpf: "98765432100",
      data_hora_prevista: "2026-11-25T14:30:00",
      status: "agendado",
      observacoes: "Retorno em 30 dias.",
      medicoes_clinicas: [],
    });

    render(<RealizarAgendamento />);
    await preencherCabecalho(user, { observacoes: "Retorno em 30 dias." });
    await preencherMedicao(user, 0);

    await user.click(
      screen.getByRole("button", { name: /Realizar Agendamento/i }),
    );

    expect(criarAgendamentoMock).toHaveBeenCalledWith(
      expect.objectContaining({ observacoes: "Retorno em 30 dias." }),
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Agendamento #8 realizado com sucesso.",
    );
  });

  it('desabilita o botão com "Salvando agendamento..." durante o envio e reabilita depois', async () => {
    const user = userEvent.setup();
    let resolvePromise!: (
      value: Awaited<ReturnType<typeof criarAgendamento>>,
    ) => void;
    criarAgendamentoMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
    );

    render(<RealizarAgendamento />);
    await preencherCabecalho(user);
    await preencherMedicao(user, 0);

    const submitPromise = user.click(
      screen.getByRole("button", { name: /Realizar Agendamento/i }),
    );

    const loadingBtn = await screen.findByRole("button", {
      name: /Salvando agendamento\.\.\./i,
    });
    expect(loadingBtn).toBeDisabled();

    resolvePromise({
      agendamento_id: 9,
      paciente_cpf: "12345678901",
      profissional_saude_cpf: "98765432100",
      data_hora_prevista: "2026-11-25T14:30:00",
      status: "agendado",
      observacoes: null,
      medicoes_clinicas: [],
    });
    await submitPromise;

    const normalBtn = await screen.findByRole("button", {
      name: /Realizar Agendamento/i,
    });
    expect(normalBtn).toBeEnabled();
  });

  it("exibe erros aninhados do 400 da API no campo correto e mantém os dados digitados", async () => {
    const user = userEvent.setup();
    criarAgendamentoMock.mockRejectedValue(
      new AgendamentoApiError(
        "Verifique os campos destacados e tente novamente.",
        400,
        {
          medicoes_clinicas: {
            0: {
              tipo_parametro: {
                tipo: ["Informe um texto válido."],
              },
            },
          },
        },
      ),
    );

    render(<RealizarAgendamento />);
    await preencherCabecalho(user);
    await preencherMedicao(user, 0);

    await user.click(
      screen.getByRole("button", { name: /Realizar Agendamento/i }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Verifique os campos destacados e tente novamente.",
    );
    expect(screen.getByText("Informe um texto válido.")).toBeInTheDocument();
    expect(screen.getByLabelText("Tipo *")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByLabelText("CPF do paciente *")).toHaveValue(
      "12345678901",
    );
    expect(screen.getByLabelText("Tipo *")).toHaveValue("Pressão Arterial");
  });

  it.each([
    [404, "Paciente não encontrado."],
    [409, "Um vínculo dos dados informados deixou de ser válido."],
  ])(
    "exibe mensagem do servidor no alerta geral para status %i",
    async (status, msg) => {
      const user = userEvent.setup();
      criarAgendamentoMock.mockRejectedValue(
        new AgendamentoApiError(msg, status),
      );

      render(<RealizarAgendamento />);
      await preencherCabecalho(user);
      await preencherMedicao(user, 0);

      await user.click(
        screen.getByRole("button", { name: /Realizar Agendamento/i }),
      );

      expect(screen.getByRole("alert")).toHaveTextContent(msg);
    },
  );

  it("exibe erro genérico em falha de rede e mantém botão habilitado", async () => {
    const user = userEvent.setup();
    criarAgendamentoMock.mockRejectedValue(new TypeError("Failed to fetch"));

    render(<RealizarAgendamento />);
    await preencherCabecalho(user);
    await preencherMedicao(user, 0);

    await user.click(
      screen.getByRole("button", { name: /Realizar Agendamento/i }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Não foi possível conectar ao servidor.",
    );
    expect(
      screen.getByRole("button", { name: /Realizar Agendamento/i }),
    ).toBeEnabled();
  });
});
