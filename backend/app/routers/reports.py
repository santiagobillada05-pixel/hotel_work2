"""Administrative reports and dashboard analytics router."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.dependencies.database import get_db
from app.dependencies.auth import require_role
from app.models.user import User, UserRole
from app.models.room import Room, RoomStatus
from app.models.reservation import Reservation, ReservationStatus
from app.models.payment import Payment, PaymentStatus
from app.utils.responses import success_response

router = APIRouter(prefix="/reports", tags=["Reportes"])


@router.get("/summary", response_model=dict)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(UserRole.admin)),
):
    """
    Resumen de métricas operativas clave para el panel administrativo.
    """
    # Rooms breakdown
    total_rooms = db.query(Room).filter(Room.is_active == True).count()
    occupied_rooms = db.query(Room).filter(Room.is_active == True, Room.status == RoomStatus.occupied).count()
    available_rooms = max(0, total_rooms - occupied_rooms)

    # Occupancy rate calculation
    occupancy_rate = round((occupied_rooms / total_rooms * 100), 1) if total_rooms > 0 else 0.0

    # Reservations breakdown
    total_reservations = db.query(Reservation).count()
    active_reservations = db.query(Reservation).filter(
        Reservation.status.in_([ReservationStatus.confirmed, ReservationStatus.checked_in])
    ).count()

    # Revenue calculation
    total_revenue_completed = (
        db.query(func.coalesce(func.sum(Payment.amount / Payment.exchange_rate), 0.0))
        .filter(Payment.status == PaymentStatus.completed)
        .scalar()
    )

    total_receivable = (
        db.query(func.coalesce(func.sum(Reservation.final_total), 0.0))
        .filter(Reservation.status != ReservationStatus.cancelled)
        .scalar()
    )

    total_guests = db.query(User).filter(User.role == UserRole.guest, User.is_active == True).count()

    summary_data = {
        "kpis": {
            "total_rooms": total_rooms,
            "occupancy_rate": occupancy_rate,
            "occupied_rooms": occupied_rooms,
            "available_rooms": available_rooms,
            "total_reservations": total_reservations,
            "active_reservations": active_reservations,
            "total_revenue": round(float(total_revenue_completed), 2),
            "total_billed": round(float(total_receivable), 2),
            "pending_balance": round(max(0.0, float(total_receivable) - float(total_revenue_completed)), 2),
            "total_registered_guests": total_guests,
        },
        "room_status_breakdown": [
            {"name": "Disponibles", "value": available_rooms, "color": "#10B981"},
            {"name": "Ocupadas", "value": occupied_rooms, "color": "#3B82F6"},
        ],
    }

    return success_response(data=summary_data, message="Resumen de dashboard generado exitosamente")


@router.get("/revenue", response_model=dict)
def get_revenue_report(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(UserRole.admin)),
):
    """Reporte de ingresos desglosado por método de pago."""
    breakdown = (
        db.query(Payment.payment_method, func.sum(Payment.amount / Payment.exchange_rate), func.count(Payment.id))
        .filter(Payment.status == PaymentStatus.completed)
        .group_by(Payment.payment_method)
        .all()
    )

    results = [
        {
            "method": method.value if hasattr(method, "value") else str(method),
            "total_amount": round(float(total or 0), 2),
            "transaction_count": count,
        }
        for method, total, count in breakdown
    ]

    return success_response(data=results, message="Reporte de ingresos obtenido exitosamente")


@router.get("/export/reservations.csv")
def export_reservations_csv(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(UserRole.admin)),
):
    """Exporta el historial de reservas en formato CSV descargable para auditoría/Excel."""
    import io
    import csv
    from fastapi.responses import Response

    reservations = db.query(Reservation).order_by(Reservation.id.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID_Reserva", "ID_Usuario", "ID_Habitacion", "Check_In", "Check_Out",
        "Huespedes", "Estado", "Base_Total_COP", "Descuento_COP", "IVA_19_COP", "Total_Final_COP", "Fecha_Creacion"
    ])

    for r in reservations:
        writer.writerow([
            r.id,
            r.user_id,
            r.room_id,
            r.check_in_date,
            r.check_out_date,
            r.num_guests,
            r.status.value if hasattr(r.status, "value") else str(r.status),
            f"{r.base_total:.2f}",
            f"{r.discount_amount:.2f}",
            f"{r.tax_amount:.2f}",
            f"{r.final_total:.2f}",
            r.created_at.strftime("%Y-%m-%d %H:%M:%S") if r.created_at else "",
        ])

    csv_data = output.getvalue().encode("utf-8-sig")  # BOM for Excel utf-8 compatibility
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="hotelwork_reservations.csv"'},
    )


@router.get("/export/revenue.csv")
def export_revenue_csv(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(UserRole.admin)),
):
    """Exporta transacciones de pago completadas en formato CSV."""
    import io
    import csv
    from fastapi.responses import Response

    payments = db.query(Payment).order_by(Payment.id.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID_Pago", "ID_Reserva", "Monto_COP", "Metodo_Pago", "Estado", "Referencia", "Fecha_Pago"
    ])

    for p in payments:
        writer.writerow([
            p.id,
            p.reservation_id,
            f"{p.amount:.2f}",
            p.payment_method.value if hasattr(p.payment_method, "value") else str(p.payment_method),
            p.status.value if hasattr(p.status, "value") else str(p.status),
            p.transaction_ref or "",
            p.paid_at.strftime("%Y-%m-%d %H:%M:%S") if p.paid_at else "",
        ])

    csv_data = output.getvalue().encode("utf-8-sig")
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="hotelwork_payments.csv"'},
    )


@router.get("/recaudacion", response_model=dict)
def get_recaudacion(
    period: str = "week",
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.admin, UserRole.staff)),
):
    """
    Nuevo reporte de recaudación por periodo (semana, mes, año).
    Retorna montos sumados de pagos confirmados usando paid_at.
    """
    import datetime
    
    # Bogota is UTC-5 all year round (no DST)
    TZ = datetime.timezone(datetime.timedelta(hours=-5), name="America/Bogota")
    now = datetime.datetime.now(TZ)
    
    # Limites
    start_of_week = now.replace(hour=0, minute=0, second=0, microsecond=0) - datetime.timedelta(days=now.weekday())
    end_of_week = start_of_week + datetime.timedelta(days=7) - datetime.timedelta(microseconds=1)
    
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if now.month == 12:
        end_of_month = now.replace(year=now.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0) - datetime.timedelta(microseconds=1)
    else:
        end_of_month = now.replace(month=now.month + 1, day=1, hour=0, minute=0, second=0, microsecond=0) - datetime.timedelta(microseconds=1)
        
    start_of_year = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    end_of_year = now.replace(year=now.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0) - datetime.timedelta(microseconds=1)

    # Convertir limites a UTC para comparar con la BD (paid_at está en UTC)
    # Ya que payment.paid_at en sqlalchemy por defecto se guarda en UTC sin tzinfo
    start_of_week_utc = start_of_week.astimezone(datetime.timezone.utc).replace(tzinfo=None)
    end_of_week_utc = end_of_week.astimezone(datetime.timezone.utc).replace(tzinfo=None)
    
    start_of_month_utc = start_of_month.astimezone(datetime.timezone.utc).replace(tzinfo=None)
    end_of_month_utc = end_of_month.astimezone(datetime.timezone.utc).replace(tzinfo=None)
    
    start_of_year_utc = start_of_year.astimezone(datetime.timezone.utc).replace(tzinfo=None)
    end_of_year_utc = end_of_year.astimezone(datetime.timezone.utc).replace(tzinfo=None)

    # Query all completed payments
    payments_query = db.query(Payment).filter(
        Payment.status == PaymentStatus.completed,
        Payment.paid_at.isnot(None)
    ).all()
    
    # Acumuladores
    totals = {
        "week": {"amount": 0.0, "count": 0, "start": start_of_week.isoformat(), "end": end_of_week.isoformat(), "by_currency": {}},
        "month": {"amount": 0.0, "count": 0, "start": start_of_month.isoformat(), "end": end_of_month.isoformat(), "by_currency": {}},
        "year": {"amount": 0.0, "count": 0, "start": start_of_year.isoformat(), "end": end_of_year.isoformat(), "by_currency": {}}
    }
    
    period_payments = []
    
    for p in payments_query:
        # p.paid_at is naive datetime in UTC (as per database.py/models usually in FastAPI apps, let's assume it is)
        # We need to evaluate it in UTC
        paid_at_utc = p.paid_at
        
        in_week = start_of_week_utc <= paid_at_utc <= end_of_week_utc
        in_month = start_of_month_utc <= paid_at_utc <= end_of_month_utc
        in_year = start_of_year_utc <= paid_at_utc <= end_of_year_utc
        
        currency = getattr(p, "currency", "COP") or "COP"
        rate = getattr(p, "exchange_rate", 1.0) or 1.0
        amount = p.amount or 0.0
        if amount > 0 and amount < 2000 and currency == "USD":
            amount = amount * 4000.0
            currency = "COP"
        base_amount = amount
        
        if in_week:
            totals["week"]["amount"] += base_amount
            totals["week"]["count"] += 1
            totals["week"]["by_currency"][currency] = totals["week"]["by_currency"].get(currency, 0.0) + p.amount
            
        if in_month:
            totals["month"]["amount"] += base_amount
            totals["month"]["count"] += 1
            totals["month"]["by_currency"][currency] = totals["month"]["by_currency"].get(currency, 0.0) + p.amount
            
        if in_year:
            totals["year"]["amount"] += base_amount
            totals["year"]["count"] += 1
            totals["year"]["by_currency"][currency] = totals["year"]["by_currency"].get(currency, 0.0) + p.amount
            
        # Add to table list if it matches the selected period
        is_selected = (period == "week" and in_week) or (period == "month" and in_month) or (period == "year" and in_year)
        if is_selected:
            # Load user and room if possible
            guest_name = "Desconocido"
            room_number = "N/A"
            if p.reservation:
                if p.reservation.user:
                    guest_name = f"{p.reservation.user.first_name} {p.reservation.user.last_name}"
                if p.reservation.room:
                    room_number = p.reservation.room.room_number
                    
            period_payments.append({
                "id": p.id,
                "amount": p.amount,
                "currency": currency,
                "exchange_rate": rate,
                "base_amount": round(base_amount, 2),
                "payment_method": p.payment_method.value if hasattr(p.payment_method, "value") else str(p.payment_method),
                "paid_at": p.paid_at.isoformat() + "Z",
                "guest_name": guest_name,
                "room_number": room_number,
                "concept": f"Reserva #{p.reservation_id}"
            })
            
    # Sort payments descending by paid_at
    period_payments.sort(key=lambda x: x["paid_at"], reverse=True)
            
    return success_response(
        data={"totals": totals, "payments": period_payments},
        message="Recaudación obtenida exitosamente"
    )
