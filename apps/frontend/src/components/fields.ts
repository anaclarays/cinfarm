import type { Field, OptionSource } from "./ResourceManager";
import { paths } from "../services/api";

export const UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");
export const STATUS = ["Agendado", "Confirmado", "Concluído", "Cancelado"];

export const srcPaciente: OptionSource = { path: paths.pacientes, value: "cpf", label: "nome_completo" };
export const srcProf: OptionSource = { path: paths.profissionais, value: "cpf", label: "nome_completo" };
export const srcEstag: OptionSource = { path: paths.estagiarios, value: "cpf", label: "nome_completo", prefix: "Estagiário" };
export const srcEstab: OptionSource = { path: paths.estabelecimentos, value: "estabelecimento_id", label: "nome" };
export const srcMed: OptionSource = { path: paths.medicamentos, value: "medicamento_id", label: "nome_medicamento" };

const pessoa = (section = "Dados pessoais"): Field[] => [
  { name: "cpf", label: "CPF", required: true, section },
  { name: "nome_completo", label: "Nome completo", required: true, section, full: true },
  { name: "telefone", label: "Telefone", section },
];

export const endereco = (section = "Endereço"): Field[] => [
  { name: "logradouro", label: "Logradouro", section, full: true },
  { name: "numero", label: "Número", section },
  { name: "complemento", label: "Complemento", section },
  { name: "bairro", label: "Bairro", section },
  { name: "cidade", label: "Cidade", section },
  { name: "estado", label: "Estado", type: "select", options: UFS, section },
  { name: "cep", label: "CEP", section },
];

export const pacienteFields: Field[] = [
  ...pessoa(),
  { name: "rg", label: "RG", section: "Dados pessoais" },
  { name: "cartao_sus", label: "Cartão SUS", section: "Dados pessoais" },
  { name: "data_nascimento", label: "Data de nascimento", type: "date", section: "Dados pessoais" },
  { name: "genero", label: "Gênero", section: "Dados pessoais" },
  { name: "sexo_bio", label: "Sexo biológico", type: "select", options: ["Feminino", "Masculino", "Intersexo"], section: "Dados pessoais" },
  { name: "raca_cor", label: "Raça/cor", type: "select", options: ["Branca", "Preta", "Parda", "Amarela", "Indígena"], section: "Dados socioeconômicos" },
  { name: "estado_civil", label: "Estado civil", type: "select", options: ["Solteiro(a)", "Casado(a)", "União estável", "Divorciado(a)", "Viúvo(a)"], section: "Dados socioeconômicos" },
  { name: "escolaridade", label: "Escolaridade", type: "select", options: ["Sem escolaridade", "Fundamental", "Médio", "Superior", "Pós-graduação"], section: "Dados socioeconômicos" },
  { name: "ocupacao", label: "Ocupação", section: "Dados socioeconômicos" },
  { name: "renda", label: "Renda (R$)", type: "number", section: "Dados socioeconômicos" },
  { name: "telefone_contato", label: "Telefone de contato", section: "Dados socioeconômicos" },
  ...endereco(),
  { name: "nome_contato_emergencia", label: "Nome", section: "Contato de emergência", full: true },
  { name: "telefone_contato_emergencia", label: "Telefone", section: "Contato de emergência" },
  { name: "relacao_emergencia", label: "Relação", section: "Contato de emergência" },
  { name: "possui_plano_saude", label: "Possui plano de saúde", type: "boolean", section: "Plano de saúde" },
  { name: "operadora", label: "Operadora", section: "Plano de saúde", showIf: (v) => !!v["possui_plano_saude"] },
];

export const profissionalFields: Field[] = [
  ...pessoa(),
  { name: "instituicao_vinculo", label: "Instituição de vínculo", section: "Dados profissionais", full: true },
  { name: "especialidade", label: "Especialidade", section: "Dados profissionais" },
  { name: "conselho", label: "Conselho", section: "Dados profissionais" },
  { name: "numero_registro", label: "Nº de registro", section: "Dados profissionais" },
];

export const estagiarioFields: Field[] = [
  ...pessoa(),
  { name: "curso", label: "Curso", section: "Formação" },
  { name: "instituicao_ensino", label: "Instituição de ensino", section: "Formação" },
];

export const estabelecimentoFields: Field[] = [
  { name: "nome", label: "Nome", required: true, section: "Dados gerais", full: true },
  { name: "tipo_atendimento", label: "Tipo de atendimento", section: "Dados gerais" },
  ...endereco(),
];

export const agendamentoFields: Field[] = [
  { name: "paciente_cpf", label: "Paciente", type: "select", optionsFrom: [srcPaciente], required: true, full: true },
  { name: "profissional_saude_cpf", label: "Profissional de saúde", type: "select", optionsFrom: [srcProf], required: true, full: true },
  { name: "data_hora_prevista", label: "Data/hora prevista", type: "datetime-local", required: true },
  { name: "status", label: "Status", type: "select", options: STATUS, required: true },
  { name: "observacoes", label: "Observações", type: "textarea" },
];

export const consultaFields: Field[] = [
  { name: "paciente_cpf", label: "Paciente", type: "select", optionsFrom: [srcPaciente], required: true, full: true, section: "Atendimento" },
  { name: "profissional_supervisor_cpf", label: "Profissional supervisor", type: "select", optionsFrom: [srcProf], required: true, full: true, section: "Atendimento" },
  { name: "responsavel_atendimento_id", label: "Responsável pelo atendimento", type: "select", optionsFrom: [srcProf, srcEstag], full: true, section: "Atendimento" },
  { name: "estabelecimento_id", label: "Estabelecimento", type: "select", optionsFrom: [srcEstab], full: true, section: "Local e data" },
  { name: "data_realizacao", label: "Data de realização", type: "date", required: true, section: "Local e data" },
  { name: "especialidade_medica", label: "Especialidade médica", section: "Local e data" },
];

export const medicamentoFields: Field[] = [
  { name: "nome_medicamento", label: "Nome do medicamento", required: true, full: true },
];

export const usoFields: Field[] = [
  { name: "paciente_cpf", label: "Paciente", type: "select", optionsFrom: [srcPaciente], required: true, full: true, section: "Vínculo" },
  { name: "medicamento_id", label: "Medicamento", type: "select", optionsFrom: [srcMed], required: true, full: true, section: "Vínculo" },
  { name: "nome", label: "Nome (como prescrito)", section: "Posologia" },
  { name: "forma_farmaceutica", label: "Forma farmacêutica", section: "Posologia" },
  { name: "dose", label: "Dose", section: "Posologia" },
  { name: "frequencia_de_uso", label: "Frequência de uso", section: "Posologia" },
  { name: "via_administrativa", label: "Via administrativa", section: "Posologia" },
  { name: "prescricao_medica", label: "Prescrição médica", section: "Posologia" },
  { name: "instrucoes", label: "Instruções", type: "textarea", section: "Posologia" },
  { name: "data_inicio", label: "Data de início", type: "date", section: "Período" },
  { name: "data_termino", label: "Data de término", type: "date", section: "Período" },
];

export const condicaoFields: Field[] = [
  { name: "nome_condicao", label: "Condição", required: true, full: true },
  { name: "tipo", label: "Tipo", type: "select", options: ["Crônica", "Aguda", "Outra"] },
  { name: "data_inicio", label: "Data de início", type: "date" },
];
export const exameFields: Field[] = [
  { name: "nome_exame", label: "Exame", required: true, full: true },
  { name: "data_realizacao", label: "Data de realização", type: "date" },
  { name: "resultado", label: "Resultado", type: "textarea" },
];
export const reacaoFields: Field[] = [
  { name: "medicamento_id", label: "Medicamento", type: "select", optionsFrom: [srcMed], required: true, full: true },
  { name: "descricao", label: "Descrição", type: "textarea" },
  { name: "data_ocorrencia", label: "Data de ocorrência", type: "date" },
];
export const parametroFields: Field[] = [
  { name: "tipo", label: "Tipo de parâmetro", required: true, full: true },
  { name: "unidade_medida", label: "Unidade de medida" },
  { name: "faixa_referencia", label: "Faixa de referência" },
];
export const medicaoFields = (agId: unknown): Field[] => [
  { name: "parametro_id", label: "Parâmetro", type: "select", optionsFrom: [{ path: paths.parametros(agId), value: "parametro_id", label: "tipo" }], required: true, full: true },
  { name: "profissional_saude_cpf", label: "Profissional", type: "select", optionsFrom: [srcProf], full: true },
  { name: "valor", label: "Valor", required: true },
  { name: "data_medicao", label: "Data", type: "date" },
  { name: "hora_medicao", label: "Hora", type: "time" },
];