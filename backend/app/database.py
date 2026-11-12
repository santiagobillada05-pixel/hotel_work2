"""Database configuration and connection management."""

import json
import os
import shutil
from sqlalchemy import create_engine, text, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import get_settings

settings = get_settings()

# Sincronización y persistencia en Railway u otros entornos en contenedor con volumen /app/data (solo para SQLite)
volume_dir = "/app/data"
volume_db = "/app/data/hotelwork.db"
seed_db = "/app/hotelwork.db"
database_url = settings.DATABASE_URL

# Compatibilidad con Supabase / Heroku / Neon que entregan postgres:// en vez de postgresql://
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

if database_url.startswith("sqlite") and os.path.exists(volume_dir):
    # Si DATABASE_URL usa la ruta por defecto relativa, redirigirla al volumen
    if database_url == "sqlite:///./hotelwork.db":
        database_url = f"sqlite:///{volume_db}"

    # Siempre que exista la base de datos local que subimos (seed_db), reemplazamos la del volumen
    if os.path.exists(seed_db):
        try:
            # Limpiar archivos temporales de WAL/journal previos para evitar conflictos de bloqueo o corrupción
            for extra in [volume_db + "-wal", volume_db + "-shm", volume_db + "-journal"]:
                if os.path.exists(extra):
                    try:
                        os.remove(extra)
                    except Exception:
                        pass
            shutil.copy2(seed_db, volume_db)
            print("[database] Base de datos local copiada y reemplazada en el volumen (/app/data/hotelwork.db) con éxito.")
        except Exception as e:
            print(f"[database] Error copiando la base de datos al volumen: {e}")

engine_kwargs = {}
if database_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Pool settings para bases de datos cliente-servidor (PostgreSQL/Supabase, MySQL)
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 300

engine = create_engine(database_url, **engine_kwargs)

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Configura pragmas de SQLite para integridad referencial y concurrencia."""
    if database_url.startswith("sqlite"):
        try:
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA busy_timeout=5000")
            cursor.close()
        except Exception as e:
            print(f"[database] Advertencia al configurar PRAGMA de SQLite: {e}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass

def init_db() -> None:
    """Initializes the database by creating all tables."""
    import app.models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    if database_url.startswith("sqlite"):
        _migrate_image_urls()
        _migrate_currency_to_cop()
    _migrate_clean_room_statuses()
    _seed_default_admin()
    _seed_default_extras()

def _seed_default_admin() -> None:
    """Seeds a default admin user if no admin exists in the database, and ensures Santiago's admin exists."""
    from app.models.user import User, UserRole
    from app.services.auth_service import hash_password
    
    with SessionLocal() as db:
        # Create default admin if absolutely no admin exists
        admin_exists = db.query(User).filter(User.role == UserRole.admin).first()
        if not admin_exists:
            default_admin = User(
                email="admin@hotelwork.com",
                hashed_password=hash_password("admin123"),
                first_name="Admin",
                last_name="Principal",
                role=UserRole.admin,
                is_active=True
            )
            db.add(default_admin)
            db.commit()
            print("[init_db] Default admin user created.")
            
        # Ensure Santiago's admin account exists
        santiago_email = getattr(settings, "DEFAULT_ADMIN_EMAIL", "agudelosantiago.inedan@gmail.com")
        santiago_user = db.query(User).filter(User.email == santiago_email).first()
        if not santiago_user:
            santiago_admin = User(
                email=santiago_email,
                hashed_password=hash_password(getattr(settings, "DEFAULT_ADMIN_PASSWORD", "Luissanti0820")),
                first_name="Santiago",
                last_name="Agudelo",
                role=UserRole.admin,
                is_active=True
            )
            db.add(santiago_admin)
            db.commit()
            print("[init_db] Santiago admin user created.")
        else:
            # If exists, ensure role is admin and active, but preserve existing password hash
            updated = False
            if santiago_user.role != UserRole.admin:
                santiago_user.role = UserRole.admin
                updated = True
            if not santiago_user.is_active:
                santiago_user.is_active = True
                updated = True
            if updated:
                db.commit()
                print("[init_db] Santiago admin role and status verified.")


def _seed_default_extras() -> None:
    """Seeds default extra services if the table is empty."""
    from app.models.extra_service import ExtraService, ExtraServiceCategory

    default_extras = [
        {"name": "Desayuno Buffet", "description": "Desayuno completo tipo buffet con opciones internacionales", "price": 35000, "category": "premium", "icon": "UtensilsCrossed"},
        {"name": "Acceso a Piscina", "description": "Acceso ilimitado a la piscina climatizada durante su estadía", "price": 25000, "category": "premium", "icon": "Waves"},
        {"name": "Spa & Bienestar", "description": "Sesión de relajación en nuestro spa con sauna y jacuzzi", "price": 80000, "category": "premium", "icon": "Sparkles"},
        {"name": "Gimnasio", "description": "Acceso completo al gimnasio equipado las 24 horas", "price": 15000, "category": "premium", "icon": "Dumbbell"},
        {"name": "WiFi Premium", "description": "Conexión WiFi de alta velocidad sin límites", "price": 0, "category": "included", "icon": "Wifi"},
        {"name": "Estacionamiento", "description": "Plaza de estacionamiento privado y vigilado", "price": 20000, "category": "premium", "icon": "Car"},
        {"name": "Servicio a la Habitación", "description": "Servicio de comidas y bebidas directamente en su habitación", "price": 45000, "category": "premium", "icon": "ConciergeBell"},
        {"name": "Lavandería Express", "description": "Servicio de lavandería y planchado en el mismo día", "price": 30000, "category": "premium", "icon": "Shirt"},
        {"name": "Minibar Premium", "description": "Minibar surtido con bebidas y snacks de cortesía", "price": 50000, "category": "premium", "icon": "Wine"},
        {"name": "Traslado Aeropuerto", "description": "Transporte privado desde/hacia el aeropuerto", "price": 60000, "category": "premium", "icon": "Plane"},
    ]

    with SessionLocal() as db:
        existing_count = db.query(ExtraService).count()
        if existing_count == 0:
            for extra_data in default_extras:
                extra = ExtraService(
                    name=extra_data["name"],
                    description=extra_data["description"],
                    price=extra_data["price"],
                    currency="COP",
                    category=ExtraServiceCategory(extra_data["category"]),
                    icon=extra_data["icon"],
                    is_active=True,
                )
                db.add(extra)
            db.commit()
            print(f"[init_db] Seeded {len(default_extras)} default extra services.")


def _migrate_image_urls() -> None:
    """
    Migration: adds image_urls_json column (if not present) and copies
    existing image_url values into image_urls_json for backward compat.
    Safe to run multiple times (idempotent).
    """
    with engine.connect() as conn:
        # 1. Add column if it does not exist (SQLite ignores if already present via exception)
        try:
            conn.execute(text("ALTER TABLE rooms ADD COLUMN image_urls_json TEXT"))
            conn.commit()
        except Exception:
            pass  # Column already exists

        # 2. Copy legacy image_url → image_urls_json for rows that have not been migrated yet
        try:
            rows = conn.execute(
                text("SELECT id, image_url FROM rooms WHERE image_urls_json IS NULL AND image_url IS NOT NULL")
            ).fetchall()
            for row in rows:
                json_val = json.dumps([row[1]])
                conn.execute(
                    text("UPDATE rooms SET image_urls_json = :json_val WHERE id = :id"),
                    {"json_val": json_val, "id": row[0]},
                )
            if rows:
                conn.commit()
                print(f"[init_db] Migrated image_url -> image_urls_json for {len(rows)} room(s).")
        except Exception as e:
            print(f"[init_db] Warning during image_url migration: {e}")


def _migrate_currency_to_cop() -> None:
    """
    Migration: Ensures that all existing rooms in the database with currency USD
    are automatically converted to Colombian Pesos (COP) by multiplying by 4000.
    Safe to run multiple times (idempotent).
    """
    with engine.connect() as conn:
        try:
            rows = conn.execute(
                text("SELECT id, price_per_night FROM rooms WHERE currency = 'USD'")
            ).fetchall()
            for row in rows:
                new_price = round(row[1] * 4000)
                conn.execute(
                    text("UPDATE rooms SET price_per_night = :new_price, currency = 'COP' WHERE id = :id"),
                    {"new_price": new_price, "id": row[0]}
                )
            if rows:
                conn.commit()
                print(f"[init_db] Migrated {len(rows)} room(s) from USD to COP successfully.")
        except Exception as e:
            print(f"[init_db] Warning during currency migration: {e}")


def _migrate_clean_room_statuses() -> None:
    """
    Migration: Ensures that rooms in 'cleaning' or 'maintenance' statuses
    are automatically normalized to 'available'. Only 'available' and 'occupied'
    are operational statuses.
    """
    with engine.connect() as conn:
        try:
            res = conn.execute(
                text("UPDATE rooms SET status = 'available' WHERE status IN ('cleaning', 'maintenance')")
            )
            conn.commit()
            if res.rowcount and res.rowcount > 0:
                print(f"[init_db] Normalized {res.rowcount} room(s) to 'available'.")
        except Exception as e:
            print(f"[init_db] Note during room status normalization: {e}")


