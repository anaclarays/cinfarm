from .agendamento import agendamento_module
from .consulta.module import consulta_module
from .core import Module
from .estabelecimento import estabelecimento_module
from .health import health_module
from .medicamento import medicamento_module
from .pessoa import pessoa_module

app_module = Module(
    name="app", 
    imports=[
        health_module, 
        agendamento_module, 
        consulta_module,
        estabelecimento_module, 
        medicamento_module, 
        pessoa_module
    ]
)
