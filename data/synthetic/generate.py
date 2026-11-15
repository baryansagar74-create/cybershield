"""
ProfileGuard — Synthetic Dataset Generator
==========================================

Generates realistic benchmark datasets containing genuine, naive fake,
and sophisticated impersonation profiles.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from app.models.train import generate_synthetic_data


def main():
    parser = argparse.ArgumentParser(description="Generate synthetic social media profile dataset")
    parser.add_argument("--count", type=int, default=5000, help="Number of rows to generate")
    parser.add_argument("--out", type=str, default="data/synthetic/profiles_synthetic.csv", help="Output path")
    args = parser.parse_args()

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"Generating {args.count} synthetic profiles...")
    df = generate_synthetic_data(n=args.count)
    df.to_csv(out_path, index=False)
    print(f"Dataset saved to {out_path} ({len(df)} records).")


if __name__ == "__main__":
    main()
