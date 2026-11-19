from .agendamento import agendamento_module
from .core import Module
from .estabelecimento import estabelecimento_module
from .health import health_module
from .medicamento import medicamento_module
from .person import person_module

app_module = Module(
    name="app", 
    imports=[health_module, agendamento_module, estabelecimento_module, medicamento_module, person_module]
)
