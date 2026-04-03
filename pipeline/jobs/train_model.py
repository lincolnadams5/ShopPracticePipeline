# jobs/train_model.py
import json
from datetime import datetime
import joblib

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score

from config import MODEL_PATH, MODEL_METADATA_PATH, METRICS_PATH, ARTIFACTS_DIR
from etl_build_warehouse import build_modeling_df, SELECTED_FEATURES

MODEL_VERSION = "1.0.0"

def train_and_save():
    df = build_modeling_df()

    label_col = "risk_score"
    feature_cols = SELECTED_FEATURES

    X = df[feature_cols]
    y = df[label_col]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=27
    )

    num_cols = X_train.select_dtypes(include=["int64", "float64"]).columns.tolist()
    cat_cols = X_train.select_dtypes(include=["object"]).columns.tolist()

    numeric_pipe = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median"))
    ])

    categorical_pipe = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore"))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_pipe, num_cols),
            ("cat", categorical_pipe, cat_cols),
        ]
    )

    model = Pipeline(steps=[
        ("prep", preprocessor),
        ("reg", LinearRegression())
    ])

    model.fit(X_train, y_train)

    y_pred_train = model.predict(X_train)
    y_pred_test  = model.predict(X_test)

    metrics = {
        "train_mae":  float(mean_absolute_error(y_train, y_pred_train)),
        "train_rmse": float(root_mean_squared_error(y_train, y_pred_train)),
        "train_r2":   float(r2_score(y_train, y_pred_train)),
        "test_mae":   float(mean_absolute_error(y_test, y_pred_test)),
        "test_rmse":  float(root_mean_squared_error(y_test, y_pred_test)),
        "test_r2":    float(r2_score(y_test, y_pred_test)),
    }

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, str(MODEL_PATH))

    metadata = {
        "model_name":        "risk_score_model",
        "model_version":     MODEL_VERSION,
        "trained_at_utc":    datetime.utcnow().isoformat(),
        "features":          feature_cols,
        "label":             label_col,
        "num_training_rows": int(len(X_train)),
        "num_test_rows":     int(len(X_test)),
    }

    with open(MODEL_METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    print("Training complete.")
    print(f"  test_mae={metrics['test_mae']:.4f}  test_rmse={metrics['test_rmse']:.4f}  test_r2={metrics['test_r2']:.4f}")
    print(f"  Model saved: {MODEL_PATH}")

if __name__ == "__main__":
    train_and_save()
