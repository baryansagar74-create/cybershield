#!/usr/bin/env python3
"""
ProfileGuard — Audit Log Hash Chain Verification CLI
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.audit.hash_chain import verify_chain
from app.database import Base, SessionLocal, engine


def main():
    print("=== ProfileGuard Cryptographic Audit Chain Verification ===")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        res = verify_chain(db)
        is_valid = res.get("valid", False)
        errors = res.get("errors", [])
        total = res.get("total", 0)

        if is_valid:
            print(f"SUCCESS: 100% of audit log entries ({total} entries) are cryptographically intact and chained.")
            sys.exit(0)
        else:
            print(f"WARNING: Chain verification detected integrity anomalies in {len(errors)} entries:")
            for err in errors:
                print(f"  - {err}")
            sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
