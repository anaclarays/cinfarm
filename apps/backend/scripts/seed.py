# scripts/seed.py
from src import create_app
from src.conf_database import db
from src.estabelecimento.model import EstabelecimentoModel
from src.medicamento.model import MedicamentoModel
from src.pessoa.model import PessoaModel 


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

# CPFs fictícios (só passam na regra de 11 dígitos)
PESSOAS = [
    {"cpf": "11111111111", "name": "Maria da Silva", "telephone": "81999990001"},
    {"cpf": "22222222222", "name": "João Pereira", "telephone": "81999990002"},
    {"cpf": "33333333333", "name": "Ana Souza", "telephone": "81999990003"},
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


def run_seed() -> dict[str, int]:
    resultado = {
        "medicamentos": seed_medicamentos(),
        "estabelecimentos": seed_estabelecimentos(),
        "pessoas": seed_pessoas(),
    }
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