#!/usr/bin/env python3
"""
ProfileGuard — Initial Admin User Provisioning CLI
"""

import getpass
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal
from app.db_models import UserAnalyst
from app.security.auth import hash_password


def main():
    print("=== ProfileGuard Admin User Provisioning ===")
    email = input("Admin Email: ").strip()
    if not email:
        print("Email is required.")
        sys.exit(1)

    name = input("Admin Full Name: ").strip() or "System Administrator"
    unit = input("Unit / Posting: ").strip() or "ITBP Cyber Command"

    pwd1 = getpass.getpass("Password: ")
    pwd2 = getpass.getpass("Confirm Password: ")

    if pwd1 != pwd2:
        print("Passwords do not match.")
        sys.exit(1)

    if len(pwd1) < 8:
        print("Password must be at least 8 characters long.")
        sys.exit(1)

    db = SessionLocal()
    try:
        existing = db.query(UserAnalyst).filter(UserAnalyst.email == email).first()
        if existing:
            print(f"User with email '{email}' already exists.")
            sys.exit(1)

        user = UserAnalyst(
            email=email,
            name=name,
            hashed_password=hash_password(pwd1),
            role="admin",
            unit=unit,
            is_active=True,
        )
        db.add(user)
        db.commit()
        print(f"Admin user '{email}' created successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
