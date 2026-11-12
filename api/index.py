from __future__ import annotations

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

# Load environment variables if .env exists
try:
    from dotenv import load_dotenv
    for env_candidate in [os.path.join(current_dir, ".env"), os.path.join(backend_dir, ".env")]:
        if os.path.exists(env_candidate):
            load_dotenv(env_candidate)
except Exception:
    pass

# Ensure Supabase PostgreSQL cloud database URL with sslmode=require
if not os.environ.get("DATABASE_URL"):
    os.environ["DATABASE_URL"] = "postgresql://postgres.cgsaxlgifvlozglwnfsz:Luissan.ti0820@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"

# Import app with safe error trapping for Vercel serverless functions
try:
    from app.main import app
    
    # Add lightweight health check for serverless
    @app.get("/api/health")
    def health_check():
        return {"status": "ok", "service": "HotelWork API", "database": "Supabase"}

except Exception as exc:
    import logging
    logging.exception("Failed to initialize HotelWork FastAPI app on Vercel")
    err_tb = traceback.format_exc()
    
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    
    app = FastAPI(title="HotelWork Error Handler")
    
    @app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
    async def fallback_handler(path_name: str):
        return JSONResponse(
            status_code=500,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*",
            },
            content={
                "success": False,
                "error": "Serverless Startup Error",
                "detail": str(exc),
                "traceback": err_tb,
            }
        )
