"""
Script de migración integral de HotelWork: De SQLite a Supabase (PostgreSQL) o MySQL.

Transfiere todas las tablas y datos existentes:
- users
- rooms
- reservations
- payments
- notifications
- checkout_records

Maneja automáticamente:
- Creación de esquema y tablas en la base de datos destino.
- Respeto del orden de llaves foráneas.
- Actualización de secuencias (sequences) en PostgreSQL / Supabase para evitar errores de ID duplicados.
"""

import sys
import os
import argparse
from datetime import datetime
from sqlalchemy import create_engine, MetaData, Table, select, text
from sqlalchemy.orm import declarative_base

# Añadir el directorio raíz de backend al sys.path para importar modelos si es necesario
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from app.database import Base
import app.models  # Asegura registro de todos los modelos


TABLES_IN_ORDER = [
    "users",
    "rooms",
    "reservations",
    "payments",
    "notifications",
    "checkout_records"
]


def fix_db_url(url: str) -> str:
    """Corrige prefijos comunes de URLs de bases de datos."""
    url = url.strip()
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url


def migrate(source_url: str, target_url: str, clear_target: bool = False):
    print("=" * 65)
    print(">>> INICIANDO MIGRACION DE HOTELWORK")
    print(f"[*] Origen (SQLite):  {source_url}")
    # Ocultar contrasena en el print
    display_target = target_url
    if "@" in display_target:
        prefix, rest = display_target.split("@", 1)
        if ":" in prefix:
            proto_user = prefix.split(":", 2)
            display_target = f"{proto_user[0]}:***@{rest}"
    print(f"[*] Destino:          {display_target}")
    print("=" * 65)

    source_engine = create_engine(source_url)
    target_engine = create_engine(
        target_url,
        pool_pre_ping=True
    )

    # 1. Crear las tablas en la base de datos destino
    print("\n[1/4] Creando / verificando tablas en la base de datos destino...")
    if clear_target:
        print("      [*] Recreando esquema limpio...")
        try:
            Base.metadata.drop_all(bind=target_engine)
        except Exception:
            pass
    Base.metadata.create_all(bind=target_engine)
    print("      [OK] Tablas verificadas y listas.")

    # Conexiones
    with source_engine.connect() as src_conn, target_engine.connect() as dst_conn:
        trans = dst_conn.begin()
        try:
            # 2. Si no se recreo pero se pidio limpiar:
            if clear_target:
                print("\n[2/4] Limpiando datos previos en la base de datos destino...")
                for table_name in reversed(TABLES_IN_ORDER):
                    if table_name in Base.metadata.tables:
                        try:
                            dst_conn.execute(text(f'DELETE FROM "{table_name}"' if "postgresql" in target_url else f"DELETE FROM `{table_name}`" if "mysql" in target_url else f"DELETE FROM {table_name}"))
                        except Exception:
                            pass
                print("      [OK] Tablas destino vaciadas.")
            else:
                print("\n[2/4] Comprobando tablas...")

            # 3. Migrar datos tabla por tabla
            print("\n[3/4] Copiando registros...")
            src_metadata = MetaData()
            src_metadata.reflect(bind=source_engine)

            total_migrated = 0

            for table_name in TABLES_IN_ORDER:
                if table_name not in src_metadata.tables or table_name not in Base.metadata.tables:
                    print(f"      [AVISO] Tabla {table_name} no encontrada en origen, omitiendo.")
                    continue

                src_table = src_metadata.tables[table_name]
                dst_table = Base.metadata.tables[table_name]

                # Leer filas de SQLite
                rows = src_conn.execute(select(src_table)).fetchall()
                if not rows:
                    print(f"      [-] {table_name.ljust(18)}: 0 registros.")
                    continue

                # Preparar diccionarios de insercion
                data_to_insert = []
                for row in rows:
                    row_dict = dict(row._mapping)
                    data_to_insert.append(row_dict)

                # Insertar en destino
                dst_conn.execute(dst_table.insert(), data_to_insert)
                print(f"      [OK] {table_name.ljust(18)}: {len(data_to_insert)} registros migrados.")
                total_migrated += len(data_to_insert)

            # 4. Actualizar secuencias en PostgreSQL (Supabase)
            if "postgresql" in target_url:
                print("\n[4/4] Sincronizando secuencias autoincrementales en PostgreSQL...")
                for table_name in TABLES_IN_ORDER:
                    try:
                        seq_query = text(f"""
                            SELECT setval(
                                pg_get_serial_sequence('{table_name}', 'id'),
                                COALESCE((SELECT MAX(id) FROM "{table_name}"), 1)
                            );
                        """)
                        dst_conn.execute(seq_query)
                    except Exception:
                        pass
                print("      [OK] Secuencias sincronizadas.")
            else:
                print("\n[4/4] Paso de secuencias omitido (no es PostgreSQL).")

            trans.commit()
            print("\n" + "=" * 65)
            print(f"[EXITO] MIGRACION COMPLETADA: {total_migrated} registros transferidos.")
            print("=" * 65)
            print("\nPasos siguientes:")
            print(" 1. Abre el archivo 'backend/.env'")
            print(" 2. Actualiza DATABASE_URL con la conexion a tu nueva base de datos:")
            print(f"    DATABASE_URL={target_url}")
            print(" 3. Reinicia tu backend:")
            print("    uvicorn app.main:app --reload --port 8000")
            print("=" * 65)

        except Exception as e:
            trans.rollback()
            print(f"\n[ERROR] Error durante la migracion: {e}")
            raise e


def main():
    parser = argparse.ArgumentParser(description="Migrador de base de datos HotelWork (SQLite -> Supabase/PostgreSQL/MySQL)")
    parser.add_argument(
        "--source",
        default=f"sqlite:///{os.path.join(current_dir, 'hotelwork.db')}",
        help="URL de la base de datos origen SQLite"
    )
    parser.add_argument(
        "--target",
        default=None,
        help="URL de la base de datos destino (ej: postgresql://postgres:password@db.xxx.supabase.co:5432/postgres)"
    )
    parser.add_argument(
        "--clear",
        action="store_true",
        help="Limpiar datos existentes en las tablas destino antes de insertar"
    )

    args = parser.parse_args()

    target = args.target
    if not target:
        print("\n=== MIGRACIÓN DE BASE DE DATOS HOTELWORK ===")
        print("Este script copiará todos los usuarios, habitaciones, reservas,")
        print("pagos, notificaciones y checkouts desde tu SQLite actual a tu base de datos real.\n")
        print("Ejemplos de URLs de conexión:")
        print(" • Supabase (Connection Pooling - Recomendada):")
        print("   postgresql://postgres.proyectoid:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres")
        print(" • Supabase (Conexión Directa):")
        print("   postgresql://postgres:password@db.proyectoid.supabase.co:5432/postgres")
        print(" • MySQL:")
        print("   mysql+pymysql://root:password@localhost:3306/hotelwork\n")
        try:
            target = input("Ingresa la DATABASE_URL de tu base de datos destino: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nOperación cancelada.")
            return

    if not target:
        print("❌ Error: No se proporcionó la URL de destino.")
        return

    target = fix_db_url(target)
    migrate(source_url=args.source, target_url=target, clear_target=args.clear)


if __name__ == "__main__":
    main()
