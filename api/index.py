import os
import sys

# Ensure current api directory and backend directory are in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

backend_dir = os.path.abspath(os.path.join(current_dir, "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Load environment variables if .env exists
from dotenv import load_dotenv
for env_candidate in [os.path.join(current_dir, ".env"), os.path.join(backend_dir, ".env")]:
    if os.path.exists(env_candidate):
        load_dotenv(env_candidate)

# Default to Supabase PostgreSQL cloud database URL if not set in environment
if not os.environ.get("DATABASE_URL"):
    os.environ["DATABASE_URL"] = "postgresql://postgres.cgsaxlgifvlozglwnfsz:Luissan.ti0820@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

from app.main import app
