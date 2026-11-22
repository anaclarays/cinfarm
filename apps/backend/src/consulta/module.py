from ..core import Module
from .controller import bp

consulta_module = Module(name="consulta", controllers=[bp])
