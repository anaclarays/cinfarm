from flask import Flask
from flask_cors import CORS

class CorsConfig:
	RESOURCE = {
		r"/api/*": {},
	}
	ORIGINS = [
		"http://localhost:5173" #frontend
	]

cors = CORS()

def build_cors(app: Flask) -> None:
	cors.init_app(
		app,
		resources=CorsConfig.RESOURCE,
		origins=CorsConfig.ORIGINS,
		supports_credentials=True
	)
	