from .core import Module
from .health import health_module
from .person import person_module

app_module = Module(
    name="app",
    imports=[health_module, person_module]
)