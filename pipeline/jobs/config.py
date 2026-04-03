# jobs/config.py
# Description: Configuration file for the jobs module, defining paths and constants.

from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATA_DIR = PROJECT_ROOT / "pipeline"
ARTIFACTS_DIR = PROJECT_ROOT / "pipeline"

OP_DB_PATH = DATA_DIR / "shop.db"

MODEL_PATH = ARTIFACTS_DIR / "risk_score_model.sav"
MODEL_METADATA_PATH = ARTIFACTS_DIR / "model_metadata.json"
METRICS_PATH = ARTIFACTS_DIR / "metrics.json"