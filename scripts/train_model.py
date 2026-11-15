#!/usr/bin/env python3
"""
ProfileGuard — ML Training CLI Script
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.models.train import main

if __name__ == "__main__":
    main()
