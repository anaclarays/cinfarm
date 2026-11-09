from ..core import Module
from .controller import bp

person_module = Module(name="person", controllers=[bp])