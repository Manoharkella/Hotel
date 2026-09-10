import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import models
from database import Base

LOCAL_DB_URL = "postgresql://postgres:Manohar@localhost:5432/hotel"
NEON_DB_URL = "postgresql://neondb_owner:npg_yRKaHcni5mu9@ep-super-fire-axa0qmum-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require"

def migrate():
    print("1. Creating schema/tables in Neon DB...")
    local_engine = create_engine(LOCAL_DB_URL)
    neon_engine = create_engine(NEON_DB_URL)

    # Recreate tables in Neon DB
    Base.metadata.drop_all(bind=neon_engine)
    Base.metadata.create_all(bind=neon_engine)
    print("   Tables created in Neon successfully!")

    LocalSession = sessionmaker(bind=local_engine)
    NeonSession = sessionmaker(bind=neon_engine)

    local_db = LocalSession()
    neon_db = NeonSession()

    try:
        # 1. Users
        users = local_db.query(models.User).all()
        print(f"2. Copying {len(users)} users...")
        for u in users:
            neon_db.add(models.User(
                id=u.id,
                full_name=u.full_name,
                email=u.email,
                password_hash=u.password_hash,
                role=u.role,
                status=u.status,
                phone=u.phone,
                loyalty_points=u.loyalty_points,
                created_at=u.created_at,
                updated_at=u.updated_at
            ))
        neon_db.commit()

        # 2. Hotels
        hotels = local_db.query(models.Hotel).all()
        print(f"3. Copying {len(hotels)} hotels...")
        for h in hotels:
            neon_db.add(models.Hotel(
                id=h.id,
                name=h.name,
                location=h.location,
                address=h.address,
                latitude=h.latitude,
                longitude=h.longitude,
                email=h.email,
                password_hash=h.password_hash,
                status=h.status,
                photos=h.photos if h.photos is not None else [],
                created_at=h.created_at,
                updated_at=h.updated_at
            ))
        neon_db.commit()

        # 3. Rooms
        rooms = local_db.query(models.Room).all()
        print(f"4. Copying {len(rooms)} rooms...")
        for r in rooms:
            neon_db.add(models.Room(
                id=r.id,
                hotel_id=r.hotel_id,
                room_type=r.room_type,
                quantity=r.quantity,
                price_per_night=r.price_per_night,
                description=r.description,
                max_guests=r.max_guests,
                bed_type=r.bed_type,
                room_size=r.room_size,
                amenities=r.amenities if r.amenities is not None else [],
                breakfast_included=r.breakfast_included,
                cancellation_policy=r.cancellation_policy,
                images=r.images if r.images is not None else [],
                created_at=r.created_at,
                updated_at=r.updated_at
            ))
        neon_db.commit()

        # 4. Wallets
        wallets = local_db.query(models.Wallet).all()
        print(f"5. Copying {len(wallets)} wallets...")
        for w in wallets:
            neon_db.add(models.Wallet(
                id=w.id,
                hotel_id=w.hotel_id,
                balance=w.balance,
                created_at=w.created_at,
                updated_at=w.updated_at
            ))
        neon_db.commit()

        # 5. Wallet Transactions
        txs = local_db.query(models.WalletTransaction).all()
        print(f"6. Copying {len(txs)} wallet transactions...")
        for t in txs:
            neon_db.add(models.WalletTransaction(
                id=t.id,
                hotel_id=t.hotel_id,
                amount=t.amount,
                description=t.description,
                transaction_type=t.transaction_type,
                created_at=t.created_at
            ))
        neon_db.commit()

        # 6. Leads
        leads = local_db.query(models.Lead).all()
        print(f"7. Copying {len(leads)} leads...")
        for l in leads:
            neon_db.add(models.Lead(
                id=l.id,
                customer_id=l.customer_id,
                destination=l.destination,
                check_in=l.check_in,
                check_out=l.check_out,
                guests=l.guests,
                room_type=l.room_type,
                budget=l.budget,
                purpose=l.purpose,
                preferences=l.preferences,
                status=l.status,
                matched_hotel_ids=l.matched_hotel_ids if l.matched_hotel_ids is not None else [],
                created_at=l.created_at,
                updated_at=l.updated_at
            ))
        neon_db.commit()

        # 7. Lead Unlocks
        unlocks = local_db.query(models.LeadUnlock).all()
        print(f"8. Copying {len(unlocks)} lead unlocks...")
        for u in unlocks:
            neon_db.add(models.LeadUnlock(
                id=u.id,
                lead_id=u.lead_id,
                hotel_id=u.hotel_id,
                credits_spent=u.credits_spent,
                unlocked_at=u.unlocked_at
            ))
        neon_db.commit()

        # 8. Quotes
        quotes = local_db.query(models.Quote).all()
        print(f"9. Copying {len(quotes)} quotes...")
        for q in quotes:
            neon_db.add(models.Quote(
                id=q.id,
                lead_id=q.lead_id,
                hotel_id=q.hotel_id,
                price=q.price,
                message=q.message,
                status=q.status,
                created_at=q.created_at
            ))
        neon_db.commit()

        # 9. Bookings
        bookings = local_db.query(models.Booking).all()
        print(f"10. Copying {len(bookings)} bookings...")
        for b in bookings:
            neon_db.add(models.Booking(
                id=b.id,
                lead_id=b.lead_id,
                customer_id=b.customer_id,
                hotel_id=b.hotel_id,
                room_id=b.room_id,
                check_in=b.check_in,
                check_out=b.check_out,
                guests=b.guests,
                total_price=b.total_price,
                commission_amount=b.commission_amount,
                payout_amount=b.payout_amount,
                payment_status=b.payment_status,
                status=b.status,
                qr_code=b.qr_code,
                created_at=b.created_at,
                updated_at=b.updated_at
            ))
        neon_db.commit()

        # 10. Reviews
        reviews = local_db.query(models.Review).all()
        print(f"11. Copying {len(reviews)} reviews...")
        for r in reviews:
            neon_db.add(models.Review(
                id=r.id,
                booking_id=r.booking_id,
                hotel_id=r.hotel_id,
                customer_id=r.customer_id,
                rating=r.rating,
                comment=r.comment,
                created_at=r.created_at
            ))
        neon_db.commit()

        # 11. Messages
        messages = local_db.query(models.Message).all()
        print(f"12. Copying {len(messages)} messages...")
        for m in messages:
            neon_db.add(models.Message(
                id=m.id,
                lead_id=m.lead_id,
                hotel_id=m.hotel_id,
                sender=m.sender,
                text=m.text,
                created_at=m.created_at
            ))
        neon_db.commit()

        # Reset Postgres Sequences in Neon
        print("13. Resetting auto-increment sequences in Neon DB...")
        with neon_engine.connect() as conn:
            for table in ["users", "hotels", "rooms", "wallets", "wallet_transactions", "leads", "lead_unlocks", "quotes", "bookings", "reviews", "messages"]:
                try:
                    conn.execute(text(f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), COALESCE((SELECT MAX(id) FROM {table}), 1));"))
                    conn.commit()
                except Exception as seq_err:
                    pass

        print("\n🎉 ALL DATA FULLY MIGRATED TO NEON POSTGRESQL!")
    finally:
        local_db.close()
        neon_db.close()

if __name__ == "__main__":
    migrate()
