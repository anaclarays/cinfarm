from datetime import date, datetime, time
from decimal import Decimal

from src import create_app
from src.agendamento.model import (
	AgendamentoModel,
	MedicaoClinicaModel,
	TipoParametroModel,
)
from src.conf_database import db
from src.estabelecimento.model import EstabelecimentoModel
from src.medicamento.model import MedicamentoModel
from src.pessoa.model import PessoaModel
from src.pessoa.profiles import CareProvider, HealthProfessional, Intern, Patient


MEDICAMENTOS = [
	"Dipirona 500 mg",
	"Paracetamol 750 mg",
	"Ibuprofeno 600 mg",
	"Amoxicilina 500 mg",
	"Losartana 50 mg",
	"Metformina 850 mg",
	"Omeprazol 20 mg",
	"Sinvastatina 20 mg",
]

ESTABELECIMENTOS = [
	{
		"nome": "UBS Boa Viagem",
		"tipo_atendimento": "publico",
		"logradouro": "Avenida Conselheiro Aguiar",
		"numero": "1200",
		"complemento": None,
		"bairro": "Boa Viagem",
		"cidade": "Recife",
		"estado": "PE",
		"cep": "51011030",
	},
	{
		"nome": "Hospital da Várzea",
		"tipo_atendimento": "publico",
		"logradouro": "Rua Doutor Manoel Machado",
		"numero": "300",
		"complemento": "Bloco B",
		"bairro": "Várzea",
		"cidade": "Recife",
		"estado": "PE",
		"cep": "50741000",
	},
	{
		"nome": "Clínica Saúde Total",
		"tipo_atendimento": "privado",
		"logradouro": "Rua da Hora",
		"numero": "45",
		"complemento": None,
		"bairro": "Espinheiro",
		"cidade": "Recife",
		"estado": "PE",
		"cep": "52020010",
	},
	{
		"nome": "Policlínica de Camaragibe",
		"tipo_atendimento": "publico",
		"logradouro": "Avenida Belmino Correia",
		"numero": "800",
		"complemento": None,
		"bairro": "Centro",
		"cidade": "Camaragibe",
		"estado": "PE",
		"cep": "54768000",
	},
]

PESSOAS = [
	{"cpf": "52998224725", "name": "Maria da Silva", "telephone": "81999990001"},
	{"cpf": "11144477735", "name": "João Pereira", "telephone": "81999990002"},
	{"cpf": "93541134780", "name": "Ana Souza", "telephone": "81999990003"},
	{"cpf": "16899535009", "name": "Rosa Maria", "telephone": "81999990004"}
]

TIPOS_PARAMETRO = [
	{"tipo": "Pressão arterial sistólica", "unidade_medida": "mmHg", "faixa_referencia": "90 - 120"},
	{"tipo": "Pressão arterial diastólica", "unidade_medida": "mmHg", "faixa_referencia": "60 - 80"},
	{"tipo": "Glicemia em jejum", "unidade_medida": "mg/dL", "faixa_referencia": "70 - 99"},
	{"tipo": "Frequência cardíaca", "unidade_medida": "bpm", "faixa_referencia": "60 - 100"},
	{"tipo": "Temperatura corporal", "unidade_medida": "°C", "faixa_referencia": "36.1 - 37.2"},
	{"tipo": "Saturação de oxigênio", "unidade_medida": "%", "faixa_referencia": "95 - 100"},
	{"tipo": "Peso", "unidade_medida": "kg", "faixa_referencia": "—"},
	{"tipo": "Altura", "unidade_medida": "cm", "faixa_referencia": "—"},
]

AGENDAMENTOS = [
	{
		"data_hora_prevista": datetime(2026, 12, 1, 9, 0),
		"status": "agendado",
		"observacoes": "Primeira consulta de acompanhamento.",
		"medicoes": [],
	},
	{
		"data_hora_prevista": datetime(2026, 12, 8, 14, 30),
		"status": "realizado",
		"observacoes": None,
		"medicoes": [
			("Pressão arterial sistólica", "120", time(14, 35)),
			("Pressão arterial diastólica", "80", time(14, 35)),
			("Glicemia em jejum", "95", time(14, 40)),
		],
	},
]


def seed_medicamentos() -> int:
	criados = 0
	for nome in MEDICAMENTOS:
		existe = db.session.scalar(
			db.select(MedicamentoModel).where(MedicamentoModel.nome_medicamento == nome)
		)
		if existe is None:
			db.session.add(MedicamentoModel(nome_medicamento=nome))
			criados += 1
	return criados


def seed_estabelecimentos() -> int:
	criados = 0
	for dados in ESTABELECIMENTOS:
		existe = db.session.scalar(
			db.select(EstabelecimentoModel).where(
				EstabelecimentoModel.nome == dados["nome"],
				EstabelecimentoModel.cep == dados["cep"],
			)
		)
		if existe is None:
			db.session.add(EstabelecimentoModel(**dados))
			criados += 1
	return criados


def seed_pessoas() -> int:
	criados = 0
	for dados in PESSOAS:
		if db.session.get(PessoaModel, dados["cpf"]) is None:
			db.session.add(PessoaModel(**dados))
			criados += 1
	return criados


def seed_perfis() -> int:
	"""Maria = paciente, João = profissional de saúde, Ana = estagiária."""
	criados = 0

	with db.session.no_autoflush:
		maria = db.session.get(PessoaModel, "52998224725")
		joao = db.session.get(PessoaModel, "11144477735")
		ana = db.session.get(PessoaModel, "16899535009")
		rosa = db.session.get(PessoaModel, "93541134780")

		if maria is not None and maria.paciente is None:
			maria.paciente = Patient(
				rg="1234567",
				cartao_sus="700000000000001",
				data_nascimento=date(1985, 3, 14),
				sexo_bio="feminino",
				genero="mulher",
				escolaridade="Ensino médio completo",
				email="maria.silva@example.com",
				telefone_contato="81999990001",
				raca_cor="parda",
				estado_civil="casada",
				ocupacao="Professora",
				renda=Decimal("3200.00"),
				cep="51011030",
				logradouro="Avenida Conselheiro Aguiar",
				estado="PE",
				cidade="Recife",
				bairro="Boa Viagem",
				numero="1200",
				complemento=None,
				nome_contato_emergencia="Carlos da Silva",
				telefone_contato_emergencia="81999990010",
				relacao_emergencia="cônjuge",
				possui_plano_saude=False,
				operadora=None,
			)
			criados += 1

		if joao is not None and joao.profissional_saude is None:
			joao.profissional_saude = HealthProfessional(
				instituicao_vinculo="Hospital da Várzea",
				especialidade="Clínica geral",
				conselho="CRM-PE",
				numero_registro="123456",
				responsavel_atendimento=CareProvider(),
			)
			criados += 1
		
		if rosa is not None and rosa.profissional_saude is None:
			rosa.profissional_saude = HealthProfessional(
				instituicao_vinculo="UBS Boa Viagem",
				especialidade="Cardiologia",
				conselho="CRM-PE",
				numero_registro="654321",
				responsavel_atendimento=CareProvider(),
			)
			criados += 1

		if ana is not None and ana.estagiario is None:
			ana.estagiario = Intern(
				curso="Medicina",
				instituicao_ensino="UFPE",
				responsavel_atendimento=CareProvider(),
			)
			criados += 1

	return criados


def seed_tipos_parametro() -> int:
	criados = 0
	for dados in TIPOS_PARAMETRO:
		existe = db.session.scalar(
			db.select(TipoParametroModel).where(TipoParametroModel.tipo == dados["tipo"])
		)
		if existe is None:
			db.session.add(TipoParametroModel(**dados))
			criados += 1
	db.session.flush()
	return criados


def seed_agendamentos() -> int:
	"""Cria agendamentos (e medições) só se já houver paciente e profissional."""
	paciente_cpf = db.session.scalar(db.select(Patient.cpf).limit(1))
	profissional_cpf = db.session.scalar(db.select(HealthProfessional.cpf).limit(1))
	if paciente_cpf is None or profissional_cpf is None:
		print("agendamentos: pulado (não há paciente/profissional cadastrados)")
		return 0

	parametros = {
		p.tipo: p.parametro_id for p in db.session.scalars(db.select(TipoParametroModel))
	}

	criados = 0
	for dados in AGENDAMENTOS:
		existe = db.session.scalar(
			db.select(AgendamentoModel).where(
				AgendamentoModel.paciente_cpf == paciente_cpf,
				AgendamentoModel.profissional_saude_cpf == profissional_cpf,
				AgendamentoModel.data_hora_prevista == dados["data_hora_prevista"],
			)
		)
		if existe is not None:
			continue

		agendamento = AgendamentoModel(
			paciente_cpf=paciente_cpf,
			profissional_saude_cpf=profissional_cpf,
			data_hora_prevista=dados["data_hora_prevista"],
			status=dados["status"],
			observacoes=dados["observacoes"],
		)
		for tipo, valor, hora in dados["medicoes"]:
			agendamento.medicoes_clinicas.append(
				MedicaoClinicaModel(
					parametro_id=parametros[tipo],
					profissional_saude_cpf=profissional_cpf,
					valor=valor,
					data_medicao=dados["data_hora_prevista"].date(),
					hora_medicao=hora,
				)
			)
		db.session.add(agendamento)
		criados += 1
	return criados


def run_seed() -> dict[str, int]:
	resultado = {
		"medicamentos": seed_medicamentos(),
		"estabelecimentos": seed_estabelecimentos(),
		"pessoas": seed_pessoas(),
		"tipos_parametro": seed_tipos_parametro(),
	}
	db.session.flush()
	resultado["perfis"] = seed_perfis()
	db.session.flush()
	resultado["agendamentos"] = seed_agendamentos()
	db.session.commit()
	return resultado


if __name__ == "__main__":
	app = create_app()
	with app.app_context():
		try:
			resultado = run_seed()
		except Exception:
			db.session.rollback()
			raise
		for tabela, qtd in resultado.items():
			print(f"{tabela}: {qtd} novo(s)")