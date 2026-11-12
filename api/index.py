from __future__ import annotations

# Top-level entrypoints required by Vercel's static AST analyzer
app = None
handler = None
application = None

import os
import sys
import traceback

# Ensure current api directory and backend directory are in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

backend_dir = os.path.abspath(os.path.join(current_dir, "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Ensure Supabase PostgreSQL cloud database URL with sslmode=require
if not os.environ.get("DATABASE_URL"):
    os.environ["DATABASE_URL"] = "postgresql://postgres.rfbkuhketoompobodvnq:123.456.789.@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require"

_import_error = None

# Import real app with safe error trapping for Vercel serverless functions
try:
    from app.main import app as real_app
    app = real_app
except Exception as exc:
    _import_error = traceback.format_exc()
    import logging
    logging.exception("Failed to initialize HotelWork FastAPI app on Vercel")
    
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    from fastapi.middleware.cors import CORSMiddleware
    
    app = FastAPI(title="HotelWork Error Handler")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Direct debug endpoint
@app.get("/api/debug")
@app.get("/debug")
def debug_endpoint():
    db_status = "untested"
    db_error = None
    rooms_count = -1
    try:
        from app.database import engine
        from sqlalchemy import text
        with engine.connect() as conn:
            rooms_count = conn.execute(text("SELECT count(*) FROM rooms")).scalar()
            db_status = "connected"
    except Exception as e:
        db_status = "failed"
        db_error = traceback.format_exc()

    return {
        "status": "ok" if not _import_error and db_status == "connected" else "error",
        "import_error": _import_error,
        "database_status": db_status,
        "database_error": db_error,
        "rooms_count": rooms_count,
        "python_version": sys.version,
    }

# Final aliases for Vercel Python serverless runtime
handler = app
application = app
