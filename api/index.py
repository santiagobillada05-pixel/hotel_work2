from __future__ import annotations

import os
import sys

# Ensure current api directory and backend directory are in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

backend_dir = os.path.abspath(os.path.join(current_dir, "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Ensure Supabase PostgreSQL cloud database URL with sslmode=require
if not os.environ.get("DATABASE_URL"):
    os.environ["DATABASE_URL"] = "postgresql://postgres.cgsaxlgifvlozglwnfsz:Luissan.ti0820@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"

# Direct top-level import for Vercel static AST analysis
from app.main import app

# Top-level aliases for Vercel Python serverless runtime
handler = app
application = app

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "HotelWork API", "database": "Supabase"}
