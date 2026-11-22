from ..core import Module
from .controller import bp

pessoa_module = Module(name="pessoa", controllers=[bp])
