from ..core import Module
from .controller import bp

agendamento_module = Module(name="agendamento", controllers=[bp])
