"""
``__main__`` shim so that ``python -m app.models.train`` works.
"""

from app.models.train import main

main()
