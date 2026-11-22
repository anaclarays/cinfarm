from src import create_app

app = create_app()
for rule in sorted(app.url_map.iter_rules(), key=lambda r: r.rule):
    if rule.endpoint == "static":
        continue
    methods = ",".join(sorted(rule.methods - {"HEAD", "OPTIONS"}))
    view = app.view_functions[rule.endpoint]
    print(f"{methods:10} {rule.rule:40} {view.__module__}.{view.__name__}")