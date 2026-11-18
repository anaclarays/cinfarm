from .agendamento import agendamento_module
from .core import Module
from .estabelecimento import estabelecimento_module
from .health import health_module
from .person import person_module

app_module = Module(
    name="app",
    imports=[health_module, person_module, estabelecimento_module, agendamento_module],
)
