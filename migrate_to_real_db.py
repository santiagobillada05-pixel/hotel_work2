"""
Acceso directo para migrar la base de datos desde la raíz del proyecto.
Uso:
  python migrate_to_real_db.py
O con parámetros:
  python migrate_to_real_db.py --target "postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
"""
import os
import sys

backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from backend.migrate_to_real_db import main

if __name__ == "__main__":
    main()
