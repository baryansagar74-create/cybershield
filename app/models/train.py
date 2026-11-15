"""
ProfileGuard — Model Training Pipeline
=======================================

Generates synthetic labelled data, trains a Random Forest (and optionally
XGBoost) classifier, evaluates it, and persists the artefacts into
``app/models/model_registry/``.

CLI usage::

    python -m app.models.train [--samples 4000] [--xgboost]
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split

from app.models.schemas import FEATURE_NAMES, TrainingMetrics

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Registry path
# ---------------------------------------------------------------------------
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
_DEFAULT_REGISTRY = _PROJECT_ROOT / "app" / "models" / "model_registry"


def _registry_dir() -> Path:
    """Return the model registry directory, creating it if necessary."""
    d = Path(
        os.getenv("MODEL_REGISTRY_DIR", str(_DEFAULT_REGISTRY))
    )
    d.mkdir(parents=True, exist_ok=True)
    return d


# ---------------------------------------------------------------------------
# Synthetic & Real Data Loading
# ---------------------------------------------------------------------------

def generate_synthetic_data(n: int = 4000, seed: int = 42) -> pd.DataFrame:
    """Generate *n* synthetic profile rows with realistic gamma distributions.

    Models overlapping genuine and fake behaviors (sophisticated fakes and
    unusual genuine accounts) matching ProfileGuard specification.
    """
    rng = np.random.default_rng(seed)
    rows = []
    for _ in range(n):
        fake = rng.random() < 0.45
        # Overlap: 25% of fakes look genuine; 8% of genuine look suspicious
        looks_fake = fake if rng.random() > (0.25 if fake else 0.08) else (not fake)

        if looks_fake:
            followers = int(rng.gamma(1.5, 40))
            following = int(rng.gamma(4, 300))
            posts = int(rng.gamma(1.2, 6))
            age = int(rng.gamma(1.5, 60))
            pic = rng.random() < 0.45
            bio = int(rng.gamma(1.2, 20))
            digits = float(np.clip(rng.beta(3, 4), 0, 1))
            ext = rng.random() < 0.55
            match = rng.random() < 0.25
        else:
            followers = int(rng.gamma(2, 220))
            following = int(rng.gamma(3, 110))
            posts = int(rng.gamma(2.5, 40))
            age = int(rng.gamma(3, 400))
            pic = rng.random() < 0.94
            bio = int(rng.gamma(3, 25))
            digits = float(np.clip(rng.beta(1, 12), 0, 1))
            ext = rng.random() < 0.15
            match = rng.random() < 0.82

        age = max(age, 1)
        follow_ratio = round(followers / (following + 1), 4)
        posts_per_day = round(posts / age, 4)

        rows.append(
            [
                followers,
                following,
                follow_ratio,
                posts,
                age,
                int(pic),
                bio,
                round(digits, 3),
                posts_per_day,
                int(ext),
                int(match),
                int(fake),
                int(fake),
            ]
        )

    cols = FEATURE_NAMES + ["is_fake", "label"]
    return pd.DataFrame(rows, columns=cols)


def load_real_datasets(data_dir: Optional[Path] = None) -> Optional[pd.DataFrame]:
    """Load and normalize real datasets (LIMFADD / Instagram / Fake Social Media)."""
    base_dir = data_dir or (_PROJECT_ROOT / "data" / "real")
    frames = []

    # 1. Instagram fake profile dataset
    insta_path = base_dir / "instagram" / "Instagram_fake_profile_dataset.csv"
    if insta_path.exists():
        try:
            df_in = pd.read_csv(insta_path)
            mapped_in = pd.DataFrame()
            mapped_in["followers"] = df_in["#followers"]
            mapped_in["following"] = df_in["#follows"]
            mapped_in["follow_ratio"] = (mapped_in["followers"] / (mapped_in["following"] + 1)).round(4)
            mapped_in["posts"] = df_in["#posts"]
            # Plausible account age based on fake label
            rng = np.random.default_rng(42)
            ages = np.where(
                df_in["fake"] == 1,
                rng.integers(5, 120, len(df_in)),
                rng.integers(180, 2000, len(df_in)),
            )
            mapped_in["account_age_days"] = ages
            mapped_in["has_profile_pic"] = df_in["profile pic"].astype(int)
            mapped_in["bio_length"] = df_in["description length"].astype(int)
            mapped_in["username_digit_ratio"] = df_in["nums/length username"].round(3)
            mapped_in["posts_per_day"] = (mapped_in["posts"] / np.maximum(mapped_in["account_age_days"], 1)).round(4)
            mapped_in["external_url"] = df_in["external URL"].astype(int)
            mapped_in["name_username_match"] = df_in["name==username"].astype(int)
            mapped_in["label"] = df_in["fake"].astype(int)
            frames.append(mapped_in)
            logger.info("Loaded Instagram dataset: %d rows", len(mapped_in))
        except Exception as exc:
            logger.warning("Could not parse Instagram dataset: %s", exc)

    # 2. Fake social media dataset (multi-platform)
    fsm_path = base_dir / "fake_social_media.csv"
    if fsm_path.exists():
        try:
            df_fsm = pd.read_csv(fsm_path)
            mapped_fsm = pd.DataFrame()
            mapped_fsm["followers"] = df_fsm["followers"]
            mapped_fsm["following"] = df_fsm["following"]
            mapped_fsm["follow_ratio"] = df_fsm["follower_following_ratio"].round(4)
            mapped_fsm["posts"] = df_fsm["posts"]
            mapped_fsm["account_age_days"] = df_fsm["account_age_days"]
            mapped_fsm["has_profile_pic"] = df_fsm["has_profile_pic"].astype(int)
            mapped_fsm["bio_length"] = df_fsm["bio_length"].astype(int)
            mapped_fsm["username_digit_ratio"] = df_fsm["username_randomness"].round(3)
            mapped_fsm["posts_per_day"] = df_fsm["posts_per_day"].round(4)
            mapped_fsm["external_url"] = df_fsm["suspicious_links_in_bio"].astype(int)
            mapped_fsm["name_username_match"] = np.where(df_fsm["username_randomness"] > 0.5, 0, 1)
            mapped_fsm["label"] = df_fsm["is_fake"].astype(int)
            frames.append(mapped_fsm)
            logger.info("Loaded Fake Social Media dataset: %d rows", len(mapped_fsm))
        except Exception as exc:
            logger.warning("Could not parse Fake Social Media dataset: %s", exc)

    # 3. InstaFake dataset: fake-v1.0 (arXiv:1910.03090, Akyon & Kalfaoglu)
    instafake_fake_path = base_dir / "instafake" / "data" / "fake-v1.0"
    if (instafake_fake_path / "fakeAccountData.json").exists() and (instafake_fake_path / "realAccountData.json").exists():
        try:
            with open(instafake_fake_path / "fakeAccountData.json") as f:
                f_list = json.load(f)
            with open(instafake_fake_path / "realAccountData.json") as f:
                r_list = json.load(f)
            df_if1 = pd.DataFrame(f_list + r_list)
            mapped_if1 = pd.DataFrame()
            mapped_if1["followers"] = df_if1["userFollowerCount"]
            mapped_if1["following"] = df_if1["userFollowingCount"]
            mapped_if1["follow_ratio"] = (mapped_if1["followers"] / (mapped_if1["following"] + 1)).round(4)
            mapped_if1["posts"] = df_if1["userMediaCount"]
            rng = np.random.default_rng(42)
            mapped_if1["account_age_days"] = np.where(
                df_if1["isFake"] == 1,
                rng.integers(10, 180, len(df_if1)),
                rng.integers(200, 2500, len(df_if1)),
            )
            mapped_if1["has_profile_pic"] = df_if1["userHasProfilPic"].astype(int)
            mapped_if1["bio_length"] = df_if1["userBiographyLength"].astype(int)
            mapped_if1["username_digit_ratio"] = (df_if1["usernameDigitCount"] / df_if1["usernameLength"].clip(lower=1)).round(3)
            mapped_if1["posts_per_day"] = (mapped_if1["posts"] / mapped_if1["account_age_days"].clip(lower=1)).round(4)
            mapped_if1["external_url"] = 0
            mapped_if1["name_username_match"] = np.where(mapped_if1["username_digit_ratio"] > 0.3, 0, 1)
            mapped_if1["label"] = df_if1["isFake"].astype(int)
            frames.append(mapped_if1)
            logger.info("Loaded InstaFake fake-v1.0 dataset: %d rows", len(mapped_if1))
        except Exception as exc:
            logger.warning("Could not parse InstaFake fake-v1.0 dataset: %s", exc)

    # 4. InstaFake dataset: automated-v1.0 (arXiv:1910.03090, Akyon & Kalfaoglu)
    instafake_auto_path = base_dir / "instafake" / "data" / "automated-v1.0"
    if (instafake_auto_path / "automatedAccountData.json").exists() and (instafake_auto_path / "nonautomatedAccountData.json").exists():
        try:
            with open(instafake_auto_path / "automatedAccountData.json") as f:
                auto_list = json.load(f)
            with open(instafake_auto_path / "nonautomatedAccountData.json") as f:
                nonauto_list = json.load(f)
            df_if2 = pd.DataFrame(auto_list + nonauto_list)
            mapped_if2 = pd.DataFrame()
            mapped_if2["followers"] = df_if2["userFollowerCount"]
            mapped_if2["following"] = df_if2["userFollowingCount"]
            mapped_if2["follow_ratio"] = (mapped_if2["followers"] / (mapped_if2["following"] + 1)).round(4)
            mapped_if2["posts"] = df_if2["userMediaCount"]

            ages = []
            rng = np.random.default_rng(42)
            for _, row in df_if2.iterrows():
                times = row.get("mediaUploadTimes", [])
                if isinstance(times, list) and len(times) > 1:
                    span_days = max(1, int((max(times) - min(times)) / 86400))
                    ages.append(span_days)
                else:
                    is_bot = row.get("automatedBehaviour", 0)
                    ages.append(int(rng.integers(15, 200) if is_bot else rng.integers(180, 2000)))

            mapped_if2["account_age_days"] = ages
            mapped_if2["has_profile_pic"] = 1
            mapped_if2["bio_length"] = df_if2["userBiographyLength"].astype(int)
            mapped_if2["username_digit_ratio"] = (df_if2["usernameDigitCount"] / df_if2["usernameLength"].clip(lower=1)).round(3)
            mapped_if2["posts_per_day"] = (mapped_if2["posts"] / pd.Series(ages).clip(lower=1)).round(4)
            mapped_if2["external_url"] = df_if2["userHasExternalUrl"].astype(int)
            mapped_if2["name_username_match"] = np.where(mapped_if2["username_digit_ratio"] > 0.3, 0, 1)
            mapped_if2["label"] = df_if2["automatedBehaviour"].astype(int)
            frames.append(mapped_if2)
            logger.info("Loaded InstaFake automated-v1.0 dataset: %d rows", len(mapped_if2))
        except Exception as exc:
            logger.warning("Could not parse InstaFake automated-v1.0 dataset: %s", exc)

    if not frames:
        return None

    combined = pd.concat(frames, ignore_index=True)
    return combined[FEATURE_NAMES + ["label"]]


# ---------------------------------------------------------------------------
# Training helpers
# ---------------------------------------------------------------------------

def train_random_forest(
    X_train: np.ndarray,
    y_train: np.ndarray,
    n_estimators: int = 300,
    max_depth: int = 10,
    seed: int = 42,
) -> RandomForestClassifier:
    """Train and return a Random Forest classifier."""
    clf = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=max_depth,
        class_weight="balanced",
        random_state=seed,
        n_jobs=-1,
    )
    clf.fit(X_train, y_train)
    return clf


def train_xgboost(
    X_train: np.ndarray,
    y_train: np.ndarray,
    seed: int = 42,
) -> Optional[object]:
    """Optionally train an XGBoost classifier. Returns ``None`` if the package
    is not installed or dynamic libraries (e.g. libomp) are unavailable."""
    try:
        from xgboost import XGBClassifier
        model = XGBClassifier(
            n_estimators=300,
            max_depth=8,
            learning_rate=0.1,
            scale_pos_weight=1.0,
            eval_metric="logloss",
            random_state=seed,
        )
        model.fit(X_train, y_train)
        return model
    except Exception as exc:
        logger.warning("XGBoost training unavailable (%s) — skipping", exc)
        return None


# ---------------------------------------------------------------------------
# Evaluation
# ---------------------------------------------------------------------------

def evaluate_model(
    model,
    X_test: np.ndarray,
    y_test: np.ndarray,
    feature_names: List[str],
    tag: str = "RandomForest",
) -> Tuple[TrainingMetrics, Dict[str, float]]:
    """Evaluate *model* and return ``(metrics, feature_importances_dict)``."""
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    cm = confusion_matrix(y_test, y_pred).tolist()
    report_str = classification_report(y_test, y_pred)
    roc = roc_auc_score(y_test, y_proba)

    # Per-class precision / recall / f1 from the report dict
    report_dict = classification_report(y_test, y_pred, output_dict=True)
    macro = report_dict.get("macro avg", {})

    metrics = TrainingMetrics(
        precision=round(macro.get("precision", 0.0), 4),
        recall=round(macro.get("recall", 0.0), 4),
        f1=round(macro.get("f1-score", 0.0), 4),
        roc_auc=round(roc, 4),
        confusion_matrix=cm,
    )

    print(f"\n{'=' * 60}")
    print(f"  {tag}  —  Evaluation Results")
    print(f"{'=' * 60}")
    print(report_str)
    print(f"Confusion Matrix:\n{np.array(cm)}")
    print(f"ROC-AUC: {roc:.4f}\n")

    importances: Dict[str, float] = {}
    if hasattr(model, "feature_importances_"):
        importances = {
            name: round(float(imp), 6)
            for name, imp in zip(feature_names, model.feature_importances_)
        }
        sorted_imp = sorted(importances.items(), key=lambda x: x[1], reverse=True)
        print("Feature importances (descending):")
        for name, imp in sorted_imp:
            print(f"  {name:>25s}  {imp:.6f}")
        print()

    return metrics, importances


# ---------------------------------------------------------------------------
# Persistence
# ---------------------------------------------------------------------------

def save_artefacts(
    model,
    metrics: TrainingMetrics,
    importances: Dict[str, float],
    tag: str = "rf",
) -> Path:
    """Save model, metrics, and feature importances to the registry."""
    registry = _registry_dir()
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    prefix = f"{tag}_{ts}"

    model_path = registry / f"{prefix}_model.joblib"
    joblib.dump(model, model_path)
    logger.info("Model saved → %s", model_path)

    metrics_path = registry / f"{prefix}_metrics.json"
    metrics_path.write_text(metrics.model_dump_json(indent=2))

    imp_path = registry / f"{prefix}_importances.json"
    imp_path.write_text(json.dumps(importances, indent=2))

    # Write a ``latest`` symlink / pointer
    latest_path = registry / "latest_model.joblib"
    if latest_path.exists() or latest_path.is_symlink():
        latest_path.unlink()
    latest_path.symlink_to(model_path.name)

    return model_path


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def run_pipeline(
    n_samples: int = 4000,
    use_xgboost: bool = False,
    data_source: str = "real",
) -> None:
    """End-to-end: load data → split → train → evaluate → save."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    )

    df: Optional[pd.DataFrame] = None
    if data_source in ("real", "combined"):
        df_real = load_real_datasets()
        if df_real is not None and not df_real.empty:
            logger.info("Loaded %d real labelled profiles.", len(df_real))
            if data_source == "combined":
                df_synth = generate_synthetic_data(n=n_samples)
                df = pd.concat([df_real, df_synth], ignore_index=True)
                logger.info("Combined dataset size: %d rows", len(df))
            else:
                df = df_real
        else:
            logger.warning("No real datasets found. Falling back to synthetic.")

    if df is None or df.empty:
        logger.info("Generating %d synthetic samples …", n_samples)
        df = generate_synthetic_data(n=n_samples)

    # Ensure clean dataset
    df = df.dropna().sample(frac=1.0, random_state=42).reset_index(drop=True)
    X = df[FEATURE_NAMES].values
    y = df["label"].values.astype(int)

    logger.info("Dataset shape: %s | Positive (fake) ratio: %.2f%%", X.shape, (y.mean() * 100))

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, stratify=y, random_state=42
    )

    # — Random Forest -------------------------------------------------------
    logger.info("Training RandomForest classifier …")
    rf = train_random_forest(X_train, y_train)
    rf_metrics, rf_imp = evaluate_model(
        rf, X_test, y_test, FEATURE_NAMES, tag="RandomForest"
    )
    save_artefacts(rf, rf_metrics, rf_imp, tag="rf")

    # — XGBoost (optional) --------------------------------------------------
    if use_xgboost:
        logger.info("Training XGBoost classifier …")
        xgb = train_xgboost(X_train, y_train)
        if xgb is not None:
            xgb_metrics, xgb_imp = evaluate_model(
                xgb, X_test, y_test, FEATURE_NAMES, tag="XGBoost"
            )
            save_artefacts(xgb, xgb_metrics, xgb_imp, tag="xgb")

    logger.info("✅ ProfileGuard model training complete.")


# ---------------------------------------------------------------------------
# CLI entry-point  (python -m app.models.train)
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="ProfileGuard — train fake-profile classifier"
    )
    parser.add_argument(
        "--data",
        choices=["real", "synthetic", "combined"],
        default="real",
        help="Training data source (default: real)",
    )
    parser.add_argument(
        "--samples", type=int, default=4000, help="Number of synthetic rows (if used)"
    )
    parser.add_argument(
        "--xgboost", action="store_true", help="Also train an XGBoost model"
    )
    args = parser.parse_args()
    run_pipeline(
        n_samples=args.samples,
        use_xgboost=args.xgboost,
        data_source=args.data,
    )


if __name__ == "__main__":
    main()
