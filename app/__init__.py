from flask import Flask
from dotenv import load_dotenv
import os

def create_app():
    app = Flask(__name__, 
                template_folder="../templates",
                static_folder="../static")
    
    # Load API key from .env file
    load_dotenv()
    app.config["ANTHROPIC_API_KEY"] = os.getenv("ANTHROPIC_API_KEY")
    
    # Register routes
    from app.routes import main
    app.register_blueprint(main)
    
    return app