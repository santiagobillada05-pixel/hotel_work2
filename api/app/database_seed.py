"""Initial database seeder with sample admin, staff, guest users and rooms."""

import json
from app.database import SessionLocal, init_db
from app.models.user import User, UserRole
from app.models.room import Room, RoomType, RoomStatus
from app.services.auth_service import hash_password

def seed_database():
    """Seeds the database with essential initial data."""
    init_db()
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(User).filter(User.email == "admin@hotelwork.com").first():
            print("Database already seeded.")
            return

        # Users
        admin = User(
            email="admin@hotelwork.com",
            hashed_password=hash_password("Admin1234!"),
            first_name="Carlos",
            last_name="Administrador",
            phone="+57 300 123 4567",
            document_id="ADM-1001",
            role=UserRole.admin,
            is_active=True,
        )

        staff = User(
            email="staff@hotelwork.com",
            hashed_password=hash_password("Staff1234!"),
            first_name="María",
            last_name="Recepción",
            phone="+57 301 987 6543",
            document_id="STF-2001",
            role=UserRole.staff,
            is_active=True,
        )

        guest = User(
            email="guest@hotelwork.com",
            hashed_password=hash_password("Guest1234!"),
            first_name="Juan",
            last_name="Huésped",
            phone="+57 312 456 7890",
            document_id="CC-10203040",
            role=UserRole.guest,
            is_active=True,
        )

        db.add_all([admin, staff, guest])
        db.commit()

        # Rooms
        rooms = [
            Room(
                room_number="101",
                room_type=RoomType.single,
                price_per_night=55.0,
                capacity=1,
                floor="1",
                status=RoomStatus.available,
                description="Habitación individual acogedora con cama individual, escritorio de trabajo y baño privado.",
                amenities=json.dumps(["WiFi de alta velocidad", "Aire acondicionado", "Escritorio de trabajo", "Smart TV"]),
                image_url="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80",
                is_active=True,
            ),
            Room(
                room_number="102",
                room_type=RoomType.double,
                price_per_night=85.0,
                capacity=2,
                floor="1",
                status=RoomStatus.available,
                description="Habitación doble espaciosa con cama queen size, vista al jardín interior y minibar.",
                amenities=json.dumps(["WiFi", "Cama Queen", "Minibar", "Balcón", "Caja fuerte"]),
                image_url="https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
                is_active=True,
            ),
            Room(
                room_number="201",
                room_type=RoomType.suite,
                price_per_night=140.0,
                capacity=3,
                floor="2",
                status=RoomStatus.available,
                description="Suite ejecutiva con sala de estar independiente, cama king size y tina de hidromasaje.",
                amenities=json.dumps(["WiFi", "Cama King", "Tina de hidromasaje", "Sala de estar", "Cafetera espresso", "Bata de baño"]),
                image_url="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
                is_active=True,
            ),
            Room(
                room_number="301",
                room_type=RoomType.deluxe,
                price_per_night=220.0,
                capacity=4,
                floor="3",
                status=RoomStatus.available,
                description="Penthouse Deluxe con vista panorámica a la ciudad, terraza privada y servicio de mayordomo.",
                amenities=json.dumps(["WiFi ultra rápido", "Terraza privada", "Jacuzzi exterior", "Camas King y Twin", "Bar privado", "Desayuno incluido"]),
                image_url="https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80",
                is_active=True,
            ),
        ]

        db.add_all(rooms)
        db.commit()
        print("Database seeded successfully with test users and rooms!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
