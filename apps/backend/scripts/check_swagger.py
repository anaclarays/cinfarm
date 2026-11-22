from src import create_app
app = create_app()

print("Rotas de documentação:")
for rule in app.url_map.iter_rules():
    if "openapi" in rule.rule or "docs" in rule.rule:
        print(" ", rule.rule)

client = app.test_client()
print("openapi.json:", client.get("/openapi.json").status_code)
print("docs:", client.get("/docs").status_code)