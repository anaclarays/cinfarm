from ..core import Module
from .controller import bp

health_module = Module(name="health", controllers=[bp])