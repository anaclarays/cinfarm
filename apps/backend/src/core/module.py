from flask import Blueprint, Flask
from dataclasses import dataclass, field

@dataclass(eq=False)
class Module:
    name: str
    controllers: list[Blueprint] = field(default_factory=list)    
    imports: list["Module"] = field(default_factory=list)

def register_module(app: Flask, module: Module, _seen: set | None = None) -> None:
    seen = _seen if _seen is not None else set()
    if module is seen:
        return
    seen.add(module)

    for imported in module.imports:
        register_module(app, imported, seen)

    for  bp in module.controllers:
        app.register_blueprint(bp)