from ..core import Module
from .controller import bp, medication_bp

person_module = Module(name="person", controllers=[bp, medication_bp])
