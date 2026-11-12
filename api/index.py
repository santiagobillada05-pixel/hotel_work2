import os
import sys

# Ensure backend directory is in python path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Load environment variables from backend/.env if present
from dotenv import load_dotenv
env_path = os.path.join(backend_path, ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)

from app.main import app
