from ..core import Module
from .controller import bp

medicamento_module = Module(name="medicamento", controllers=[bp])
