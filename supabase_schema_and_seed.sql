-- ============================================================
-- HOTELWORK - SCRIPT MAESTRO DE BASE DE DATOS SUPABASE
-- Ejecutar este script en: Supabase Dashboard > SQL Editor > Run
-- ============================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA: USERS
CREATE TABLE IF NOT EXISTS public.users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    document_id VARCHAR(50),
    role VARCHAR(20) NOT NULL DEFAULT 'guest',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABLA: ROOMS
CREATE TABLE IF NOT EXISTS public.rooms (
    id BIGSERIAL PRIMARY KEY,
    room_number VARCHAR(20) UNIQUE NOT NULL,
    room_type VARCHAR(20) NOT NULL,
    price_per_night NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'COP',
    capacity INTEGER NOT NULL DEFAULT 2,
    description TEXT,
    amenities JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'available',
    floor INTEGER NOT NULL DEFAULT 1,
    image_url VARCHAR(500),
    image_urls JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABLA: EXTRA SERVICES (SERVICIOS ADICIONALES)
CREATE TABLE IF NOT EXISTS public.extra_services (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'COP',
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    icon VARCHAR(50) DEFAULT 'Sparkles',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABLA: RESERVATIONS
CREATE TABLE IF NOT EXISTS public.reservations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    room_id BIGINT REFERENCES public.rooms(id) ON DELETE RESTRICT,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    num_guests INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    base_total NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    final_total NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    special_requests TEXT,
    checked_in_at TIMESTAMPTZ,
    checked_out_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TABLA: RESERVATION EXTRAS
CREATE TABLE IF NOT EXISTS public.reservation_extras (
    id BIGSERIAL PRIMARY KEY,
    reservation_id BIGINT REFERENCES public.reservations(id) ON DELETE CASCADE,
    extra_service_id BIGINT REFERENCES public.extra_services(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABLA: PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
    id BIGSERIAL PRIMARY KEY,
    reservation_id BIGINT REFERENCES public.reservations(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_type VARCHAR(50) NOT NULL DEFAULT 'full_payment',
    status VARCHAR(20) NOT NULL DEFAULT 'completed',
    transaction_reference VARCHAR(100),
    notes TEXT,
    paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. TABLA: NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. TABLA: CHECKOUT RECORDS
CREATE TABLE IF NOT EXISTS public.checkout_records (
    id BIGSERIAL PRIMARY KEY,
    reservation_id BIGINT REFERENCES public.reservations(id) ON DELETE CASCADE,
    staff_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    room_id BIGINT REFERENCES public.rooms(id) ON DELETE RESTRICT,
    total_charged NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    damage_charges NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    room_condition_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PERMISOS Y DESACTIVACIÓN DE RLS PARA LECTURA/ESCRITURA DIRECTA
-- ============================================================
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.extra_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_extras DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_records DISABLE ROW LEVEL SECURITY;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- ============================================================
-- SEED DATA: DATOS INICIALES DEL HOTEL
-- ============================================================

-- 1. USUARIOS INICIALES (Contraseña de admin: Luissanti0820)
-- Hash bcrypt seguro generado para Luissanti0820
INSERT INTO public.users (email, hashed_password, first_name, last_name, phone, document_id, role, is_active)
VALUES 
('agudelosantiago.inedan@gmail.com', '$2b$10$WCyvNw5YmrkUbEttnK52m.lKbmdM22FX0rOMMFvAI5dvvD//cvi1q', 'Santiago', 'Agudelo', '3043900445', '1056777565', 'admin', true),
('staff@hotelwork.com', '$2b$10$WCyvNw5YmrkUbEttnK52m.lKbmdM22FX0rOMMFvAI5dvvD//cvi1q', 'Carlos', 'Recepción', '3001234567', '987654321', 'staff', true),
('huesped@hotelwork.com', '$2b$10$WCyvNw5YmrkUbEttnK52m.lKbmdM22FX0rOMMFvAI5dvvD//cvi1q', 'Ana', 'Gómez', '3109876543', '123456789', 'guest', true)
ON CONFLICT (email) DO NOTHING;

-- 2. HABITACIONES (8 Habitaciones con tarifas en COP y fotos reales)
INSERT INTO public.rooms (room_number, room_type, price_per_night, currency, capacity, description, amenities, status, floor, image_url, image_urls, is_active)
VALUES
('101', 'single', 80000.00, 'COP', 1, 'Habitación individual acogedora con cama individual, escritorio de trabajo y baño privado con agua caliente.', '["WiFi de alta velocidad", "Aire acondicionado", "Escritorio de trabajo", "TV pantalla plana"]'::jsonb, 'available', 1, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80', '["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80"]'::jsonb, true),
('102', 'double', 120000.00, 'COP', 2, 'Habitación doble espaciosa con cama matrimonial queen size, balcón con vista al jardín interior y baño privado.', '["WiFi de alta velocidad", "Aire acondicionado", "Balcón privado", "Smart TV 43 pulgadas", "Caja fuerte"]'::jsonb, 'available', 1, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80', '["https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80"]'::jsonb, true),
('203', 'single', 85000.00, 'COP', 1, 'Habitación individual moderna en segundo piso con excelente iluminación natural, escritorio ergonómico y baño privado.', '["WiFi de alta velocidad", "Aire acondicionado", "Escritorio ergonómico", "TV HD"]'::jsonb, 'available', 2, 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=800&q=80', '["https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=800&q=80"]'::jsonb, true),
('50', 'deluxe', 200000.00, 'COP', 4, 'Habitación Deluxe con cama King, sala de estar independiente, balcón panorámico y acabados de lujo.', '["WiFi", "Aire acondicionado", "Smart TV", "Cama King", "Cafetera"]'::jsonb, 'available', 1, 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80', '["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80"]'::jsonb, true),
('201', 'suite', 240000.00, 'COP', 3, 'Suite ejecutiva con sala de estar independiente, cama king size y tina de hidromasaje.', '["WiFi", "Cama King", "Tina de hidromasaje", "Mini bar", "Smart TV 55 pulgadas", "Vista a la ciudad"]'::jsonb, 'available', 2, 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80', '["https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80"]'::jsonb, true),
('301', 'deluxe', 280000.00, 'COP', 4, 'Penthouse Deluxe con vista panorámica a la ciudad, terraza privada y servicio de mayordomo.', '["WiFi ultra rápido", "Terraza privada", "Jacuzzi exterior", "Cama King", "Cocina equipada", "Servicio a la habitación 24/7"]'::jsonb, 'available', 3, 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80', '["https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80"]'::jsonb, true),
('202', 'double', 130000.00, 'COP', 2, 'Habitación doble contemporánea con dos camas individuales, vista al parque y minibar.', '["WiFi", "Aire acondicionado", "Dos camas twin", "Smart TV"]'::jsonb, 'available', 2, 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80', '["https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80"]'::jsonb, true),
('103', 'suite', 210000.00, 'COP', 3, 'Suite familiar acogedora con cama queen y sofá cama, ideal para estancias prolongadas.', '["WiFi", "Aire acondicionado", "Sofá cama", "Microondas", "Nevera ejecutiva"]'::jsonb, 'available', 1, 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80', '["https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80"]'::jsonb, true)
ON CONFLICT (room_number) DO NOTHING;

-- 3. SERVICIOS ADICIONALES (10 Extras con precios en COP)
INSERT INTO public.extra_services (name, description, price, currency, category, icon, is_active)
VALUES
('Desayuno Buffet', 'Desayuno completo tipo buffet con opciones internacionales y estación de café.', 35000.00, 'COP', 'alimentacion', 'Utensils', true),
('Acceso a Piscina', 'Acceso ilimitado a la piscina climatizada durante su estadía.', 25000.00, 'COP', 'recreacion', 'Waves', true),
('Spa & Bienestar', 'Sesión de relajación en nuestro spa con sauna y jacuzzi.', 80000.00, 'COP', 'bienestar', 'Sparkles', true),
('Gimnasio', 'Acceso completo al gimnasio equipado las 24 horas.', 15000.00, 'COP', 'fitness', 'Dumbbell', true),
('Estacionamiento', 'Parqueadero seguro y cubierto disponible las 24 horas.', 20000.00, 'COP', 'transporte', 'Car', true),
('Servicio a la Habitación', 'Atención personalizada y entrega de alimentos directamente en su habitación.', 45000.00, 'COP', 'servicio', 'Coffee', true),
('Lavandería Express', 'Servicio de lavandería y planchado en menos de 24 horas.', 30000.00, 'COP', 'servicio', 'Shirt', true),
('Minibar Premium', 'Minibar surtido con bebidas y snacks de primera calidad.', 50000.00, 'COP', 'alimentacion', 'Wine', true),
('Traslado Aeropuerto', 'Transporte privado desde y hacia el aeropuerto.', 60000.00, 'COP', 'transporte', 'Plane', true),
('Late Check-out', 'Salida extendida hasta las 4:00 PM (sujeto a disponibilidad).', 40000.00, 'COP', 'servicio', 'Clock', true)
ON CONFLICT DO NOTHING;
