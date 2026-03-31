## 17.1 Introduction
### What Deployment Really Means
- First version - a deployed model embedded directly inside an application
- Foundational deployment pattern - *end-to-end* ML pipeline that lives inside your application environment
#### Deployment is about Reliability
- **repeatability:** the same pipeline produces the same outputs when run on the same inputs
- **traceability:** you can identify which code, data, and model version produced a prediction
- **separation of concerns:** training code, inference code, and data access code are organized clearly
- **safe failure:** the system fails gracefully (with clear logging) instead of silently producing unreliable outputs
#### Preview: Simplest "Deployed Model"
```python
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.datasets import make_classification
import joblib

# 1. Train a small model (toy example)
X, y = make_classification(n_samples=500, n_features=8, random_state=42)
model = LogisticRegression(max_iter=500)
model.fit(X, y)

# 2. Save the model artifact to disk
joblib.dump(model, "model.sav")

# 3. Load the model artifact later (simulating an application restart)
loaded = joblib.load("model.sav")

# 4. Run inference on new data
x_new = np.random.rand(1, 8)
pred = loaded.predict(x_new)
proba = loaded.predict_proba(x_new)

print("Prediction:", int(pred[0]))
print("Probabilities:", proba[0])

# Output:
```

>[!IMPORTANT]
>A trained model is just an **artifact that can be persisted and reused.** The rest of the deployment work is about building a stable pipeline around that artifact.

## 17.2 Deployment Architecture
### Overview
#### Workflow
1. Data flows into a live database
2. Schedule training script rebuilds the model periodically
3. Model is saved to disk
4. Application loads that saved model to make predictions on new records.
#### Core Components
- **application:** collects inputs, writes new records, and requests predictions during user workflows
- **operational database:** the live system of record (e.g., PostgreSQL, MySQL, SQL Server) storing application data
- **periodic training script:** a Python program that queries the database, cleans data, trains a model, evaluates it, and saves artifacts
- **saved model file:** a serialized artifact (e.g., a `.sav` file) that the application can load for inference
- **inference code path:** application logic that loads the latest model and produces predictions for new inputs
#### End-to-End Data Flow
1. The application writes new transactions and events into the operational database.
2. On a schedule, a training scripts reads the latest data.
3. The scripts runs the same cleaning and feature engineering logic used in modeling.
4. The script trains and evaluates the model, then saves the model artifact (and often a preprocessing artifact) to a known location.
5. The application loads the newest saved model and uses it to generate predictions during normal workflows.
### Architecture Diagram
![[Pasted image 20260330140319.png]]
## 17.3 End-to-End Pipeline
### Pipeline Structure
#### Why This Structure Matters
- Separating the pipeline into stages enforces discipline
- Easier to test, modify and explain individual stages
- Essentially the CRISP-DM process turned into code
#### Stages
1. **Data ingestion:** DB connection, query relevant records, load into working DataFrame. Defines the snapshot of data used for training
2. **Automated cleaning:** Apply same reusable cleaning functions (wrangling, dates, bins, missing data, outliers, etc.). No dataset-specific logic should appear beyond this stage
3. **Feature engineering:** Transform cleaned data into model-ready features, including encoding, scaling, and derived variables. These transformations must be identical during training and inference, ideally enforced through shared pipeline code.
4. **Model training:** Fit the selected algorithm using the engineered features. This step mirrors traditional supervised learning and should include clear configuration of hyperparameters.
5. **Evaluation:** Measure performance using a validation or holdout set. Metrics should be logged and compared over time to detect degradation or improvement.
6. **Model serialization:** Save the trained model (and any required preprocessing objects) to disk in a standardized format such as `.sav`. This artifact is what the application will load for inference.
## 17.4 ETL

>[!IMPORTANT]
>Models are rarely trained directly on live databases, instead data is **extracted, transformed, and loaded (ETL)** into a separate analytical store - optimized for modeling.

### ETL Script Example
#### Extract and Join Operational Data
- Connect to the operational database and load tables needed

```python
import sqlite3
import pandas as pd

# Connect to operational database
conn = sqlite3.connect("shop.db")

# Load core tables
orders = pd.read_sql("SELECT * FROM orders", conn)
customers = pd.read_sql("SELECT * FROM customers", conn)
order_items = pd.read_sql("SELECT * FROM order_items", conn)
products = pd.read_sql("SELECT * FROM products", conn)

conn.close()

print(orders.shape, customers.shape, order_items.shape, products.shape)
```
#### Denormalize to One Row per Order
##### Aggregate Order-Level Features
```python
# Aggregate order items
order_item_features = (
order_items
  .merge(products, on="product_id", how="left")
  .groupby("order_id")
  .agg(
	num_items=("quantity", "sum"),
	avg_price=("price", "mean"),
	total_value=("price", "sum"),
	avg_weight=("weight", "mean")
  )
  .reset_index()
)

order_item_features.head()
```
##### Join to a single table
```python
# Join everything into one modeling table
df = (
orders
  .merge(customers, on="customer_id", how="left")
  .merge(order_item_features, on="order_id", how="left")
)

df.head()
```
#### Feature Engineering for Late Delivery
- Create small number of transparent features that plausibly influence delivery delays
	- Deterministic and reproducible features
	- Safe to use in both training and inference

```python
# Convert dates
df["order_date"] = pd.to_datetime(df["order_date"])
df["ship_date"] = pd.to_datetime(df["ship_date"])

# Delivery time (used only to define the label)
df["delivery_days"] = (df["ship_date"] - df["order_date"]).dt.days

# Customer age
df["birthdate"] = pd.to_datetime(df["birthdate"])
df["customer_age"] = (df["order_date"] - df["birthdate"]).dt.days // 365

# Historical order volume per customer
df["customer_order_count"] = (
df.groupby("customer_id")["order_id"]
  .transform("count")
)

df[[
"num_items",
"total_value",
"avg_weight",
"customer_age",
"customer_order_count"
]].describe()
```
#### Define the Modeling Target
- For the example, we are predicting whether an order is delivered late using a simple business rule

```python
# Define target: late delivery (1 = late, 0 = on time)
df["late_delivery"] = (df["delivery_days"] > 5).astype(int)

df["late_delivery"].value_counts(normalize=True)
```
#### Load into the Analytical Database
- Write the denormalized dataset into a separate SQLite database used exclusively for modeling

```python
# Connect to analytical database
warehouse_conn = sqlite3.connect("warehouse.db")

# Write modeling table
df.to_sql(
"fact_orders_ml",
warehouse_conn,
if_exists="replace",
index=False
)

warehouse_conn.close()

print("warehouse.db created with table: fact_orders_ml")
```
## 17.5 Training
### Model Training Steps
#### Load the Modeling Data
- Load the denormalized modeling table from the analytical database (the warehouse SQLite file)
- Each row represents one order, also includes engineered features and a labeled target

```python
import sqlite3
import pandas as pd

conn = sqlite3.connect("warehouse.db")

# Load the modeling table created by the ETL step
df = pd.read_sql("SELECT * FROM fact_orders_ml", conn)
conn.close()

print(df.shape)
df.head()
```
#### Select Features and Target
- Define columns used for modeling
- Makes pipeline transparent and ensures the same features are used both in training and inference

```python
from sklearn.model_selection import train_test_split

label_col = "late_delivery"

feature_cols = [
	"num_items",
	"total_value",
	"avg_weight",
	"customer_age",
	"customer_order_count"
]

X = df[feature_cols]
y = df[label_col].astype(int)

X_train, X_test, y_train, y_test = train_test_split(
	X, y,
	test_size=0.25,
	random_state=42,
	stratify=y
)

X_train.shape, X_test.shape
```

>[!NOTE]
>Don't perform ad-hoc cleaning or feature creation inside the training step - that works belongs in ETL. Training should remain consistent, repeatable, and auditable.

#### Build a Training Pipeline
- Package preprocessing and model into Pipeline to be saved and reused

```python
      from sklearn.pipeline import Pipeline
      from sklearn.impute import SimpleImputer
      from sklearn.preprocessing import StandardScaler
      from sklearn.linear_model import LogisticRegression

      pipeline = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
        ("model", LogisticRegression(max_iter=1000))
      ])

      pipeline
```
#### Train the Model
- Single method call

```python
pipeline.fit(X_train, y_train)
```
#### Evaluate Performance
- Evaluate on unseen data

```python
from sklearn.metrics import classification_report, accuracy_score, f1_score, roc_auc_score

y_pred = pipeline.predict(X_test)
y_prob = pipeline.predict_proba(X_test)[:, 1]

accuracy = accuracy_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)
roc_auc = roc_auc_score(y_test, y_prob)

report = classification_report(y_test, y_pred, output_dict=True)

accuracy, f1, roc_auc
```

>[!NOTE]
>These metrics should always be recorded alongside the model so performance can be compared across retraining runs.
#### Save the Model Artifact
- Serialize the entire pipeline using `joblib`, preserving preprocessing and modeling logic together

```python
import joblib

joblib.dump(pipeline, "late_deliver_model.sav")
```
#### Save Metrics and Metadata
- Production models should always be accompanied by metadata (training context) and metrics (evaluation results)
- Makes model auditable, traceable, and reproducible

```python
import json
from datetime import datetime

model_version = "1.0.0"

metadata = {
	"model_name": "late_delivery_pipeline",
	"model_version": model_version,
	"trained_at_utc": datetime.utcnow().isoformat(),
	"warehouse_table": "fact_orders_ml",
	"num_training_rows": int(X_train.shape[0]),
	"num_test_rows": int(X_test.shape[0]),
	"features": feature_cols
}

metrics = {
	"accuracy": float(accuracy),
	"f1": float(f1),
	"roc_auc": float(roc_auc),
	"classification_report": report
}

with open("model_metadata.json", "w", encoding="utf-8") as f:
	json.dump(metadata, f, indent=2)

with open("metrics.json", "w", encoding="utf-8") as f:
	json.dump(metrics, f, indent=2)
```
### What Gets Deployed
#### Deployed Artifacts
- `late_delivery_model.sav` - the trained pipeline (preprocessing + model)
- `model_metadata.json` - version, timestamp, row counts, and feature list
- `metrics.json` - evaluation metrics and classification report
## 17.6 Inference
### Inference Phase Steps
#### Load the Trained Model
- Load the serialized model artifact produced during training

```python
import joblib

model = joblib.load("late_delivery_model.sav")
model
```
#### Load New Orders from Operational Database
- Predictions are generated on live operational data, not the analytical warehouse

```python
import sqlite3
import pandas as pd

conn = sqlite3.connect("shop.db")

query = """
SELECT
	o.order_id,
	o.num_items,
	o.total_value,
	o.avg_weight,
	o.order_date,
	c.birthdate,
	c.customer_id
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE o.fulfilled = 0
"""

df_live = pd.read_sql(query, conn)
df_live.head()
```
#### Feature Engineering at Inference Time
- Inference must apply the *same feature logic* used during training
- In production systems - logic should be shared code imported by both training and inference scripts

```python
from datetime import datetime

# Customer age (consistent with ETL logic)
df_live["birthdate"] = pd.to_datetime(df_live["birthdate"])
df_live["order_date"] = pd.to_datetime(df_live["order_date"])
df_live["customer_age"] = (
	(df_live["order_date"] - df_live["birthdate"]).dt.days // 365
)

# Historical order count per customer
order_counts = (
	df_live.groupby("customer_id")["order_id"]
	  .transform("count")
)

df_live["customer_order_count"] = order_counts

feature_cols = [
	"num_items",
	"total_value",
	"avg_weight",
	"customer_age",
	"customer_order_count"
]

X_live = df_live[feature_cols]
```
#### Generate Predictions
- Probabilities are often more useful than binary predictions for operational decision-making

```python
df_live["late_delivery_prob"] = model.predict_proba(X_live)[:, 1]
df_live["late_delivery_pred"] = model.predict(X_live)

df_live[["order_id", "late_delivery_prob", "late_delivery_pred"]].head()
```
#### Write Predictions Back to the Operational Database
- Predictions become most valuable when written back into systems that drive action

```python
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS order_predictions (
	order_id INTEGER PRIMARY KEY,
	late_delivery_probability REAL,
	predicted_late_delivery INTEGER,
	prediction_timestamp TEXT
)
""")

rows = [
	(
	  int(row.order_id),
	  float(row.late_delivery_prob),
	  int(row.late_delivery_pred),
	  datetime.utcnow().isoformat()
	)
	for row in df_live.itertuples()
]

cursor.executemany("""
INSERT OR REPLACE INTO order_predictions
(order_id, late_delivery_probability, predicted_late_delivery, prediction_timestamp)
VALUES (?, ?, ?, ?)
""", rows)

conn.commit()
conn.close()
```
### Using Predictions in the Application
#### Web Application
- Doesn't need to know anything about the machine learning
- Simply queries a table that already contains predictions
- Enables a warehouse dashboard to prioritize orders most likely to be delayed
#### Key Deployment Pattern
- Models are trained offline
- Predictions are written into operational systems
- Applications consume predictions like any other data
## 17.7 Scheduled Jobs
#### Recap
- Convert ML logic into python scripts to be executed in a repeating cycle:
	- **ETL** creates a denormalized modeling table in a separate SQLite warehouse file
	- **Training** trains a model from the warehouse table, saves the model file, and saves metadata and metrics.
	- **Inference** loads the saved model and writes predictions back into the operational database for the application to use.
### Project Configuration
#### Project Folder Layout
```
project/
	data/
	  shop.db
	  warehouse.db
	artifacts/
	  late_delivery_model.sav
	  model_metadata.json
	  metrics.json
	jobs/
	  config.py
	  utils_db.py
	  etl_build_warehouse.py
	  train_model.py
	  run_inference.py
```

- `data/` holds your operational database and your simplified warehouse database
- `artifacts/` holds outputs produced by training
#### Shared Configuration
- Jobs should agree on paths and filenames
- Put shared paths in one place, and make sure the artifacts folder exists before saving outputs
##### Example `jobs/config.py`
```python
# jobs/config.py
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]

DATA_DIR = PROJECT_ROOT / "data"
ARTIFACTS_DIR = PROJECT_ROOT / "artifacts"

OP_DB_PATH = DATA_DIR / "shop.db"
WH_DB_PATH = DATA_DIR / "warehouse.db"

MODEL_PATH = ARTIFACTS_DIR / "late_delivery_model.sav"
MODEL_METADATA_PATH = ARTIFACTS_DIR / "model_metadata.json"
METRICS_PATH = ARTIFACTS_DIR / "metrics.json"
```
#### Database Utilities
- Helps keep DB code consistent
##### Example: `jobs/utils_db.py`
```python
# jobs/utils_db.py
import sqlite3
from contextlib import contextmanager

@contextmanager
def sqlite_conn(db_path):
	conn = sqlite3.connect(str(db_path))
	try:
	  yield conn
	finally:
	  conn.close()

def ensure_predictions_table(conn):
	cur = conn.cursor()
	cur.execute("""
	CREATE TABLE IF NOT EXISTS order_predictions (
	  order_id INTEGER PRIMARY KEY,
	  late_delivery_probability REAL,
	  predicted_late_delivery INTEGER,
	  prediction_timestamp TEXT
	)
	""")
	conn.commit()
```
### Deployment Example Code
#### Job 1: ETL to Build the Warehouse
- Reads operational tables and writes a denormalized modeling table into a separate SQLite database (`warehouse.db`)

```python
# jobs/etl_build_warehouse.py
import pandas as pd
from datetime import datetime
from config import OP_DB_PATH, WH_DB_PATH
from utils_db import sqlite_conn

def build_modeling_table():
	with sqlite_conn(OP_DB_PATH) as conn:
	  query = """
	  SELECT
		o.order_id,
		o.customer_id,
		o.num_items,
		o.total_value,
		o.avg_weight,
		o.order_timestamp,
		o.late_delivery AS label_late_delivery,
		c.gender,
		c.birthdate
	  FROM orders o
	  JOIN customers c ON o.customer_id = c.customer_id
	  """
	  df = pd.read_sql(query, conn)
	
	df["order_timestamp"] = pd.to_datetime(df["order_timestamp"], errors="coerce")
	df["birthdate"] = pd.to_datetime(df["birthdate"], errors="coerce")
	
	# Feature engineering kept simple and repeatable
	now_year = datetime.now().year
	df["customer_age"] = now_year - df["birthdate"].dt.year
	
	df["order_dow"] = df["order_timestamp"].dt.dayofweek
	df["order_month"] = df["order_timestamp"].dt.month
	
	modeling_cols = [
	  "order_id",
	  "customer_id",
	  "num_items",
	  "total_value",
	  "avg_weight",
	  "customer_age",
	  "order_dow",
	  "order_month",
	  "label_late_delivery"
	]
	
	df_model = df[modeling_cols].dropna(subset=["label_late_delivery"])
	
	with sqlite_conn(WH_DB_PATH) as wh_conn:
	  df_model.to_sql("modeling_orders", wh_conn, if_exists="replace", index=False)
	
	return len(df_model)

if __name__ == "__main__":
	row_count = build_modeling_table()
	print(f"Warehouse updated. modeling_orders rows: {row_count}")
```
#### Job 2: Train the Model and Save Artifacts
- Trains the model from the warehouse table and writes three outputs to disk:
	- `late_delivery_model.sav` (trained model file)
	- `model_metadata.json` (version, timestamp, row counts, feature list)
	- `metrics.json` (evaluation metrics)

```python
# jobs/train_model.py
import json
from datetime import datetime
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score
from sklearn.linear_model import LogisticRegression

from config import WH_DB_PATH, ARTIFACTS_DIR, MODEL_PATH, MODEL_METADATA_PATH, METRICS_PATH
from utils_db import sqlite_conn

MODEL_VERSION = "1.0.0"

def train_and_save():
	with sqlite_conn(WH_DB_PATH) as conn:
	  df = pd.read_sql("SELECT * FROM modeling_orders", conn)
	
	label_col = "label_late_delivery"
	
	feature_cols = [c for c in df.columns if c != label_col]
	X = df[feature_cols]
	y = df[label_col].astype(int)
	
	X_train, X_test, y_train, y_test = train_test_split(
	  X, y, test_size=0.2, random_state=42, stratify=y
	)
	
	numeric_features = ["num_items", "total_value", "avg_weight", "customer_age", "order_dow", "order_month"]
	categorical_features = []
	
	numeric_pipe = Pipeline(steps=[
	  ("imputer", SimpleImputer(strategy="median"))
	])
	
	categorical_pipe = Pipeline(steps=[
	  ("imputer", SimpleImputer(strategy="most_frequent")),
	  ("onehot", OneHotEncoder(handle_unknown="ignore"))
	])
	
	preprocessor = ColumnTransformer(
	  transformers=[
		("num", numeric_pipe, numeric_features),
		("cat", categorical_pipe, categorical_features)
	  ],
	  remainder="drop"
	)
	
	clf = LogisticRegression(max_iter=500)
	
	model = Pipeline(steps=[
	  ("prep", preprocessor),
	  ("clf", clf)
	])
	
	model.fit(X_train, y_train)
	
	y_pred = model.predict(X_test)
	y_prob = model.predict_proba(X_test)[:, 1]
	
	metrics = {
	  "accuracy": float(accuracy_score(y_test, y_pred)),
	  "f1": float(f1_score(y_test, y_pred)),
	  "roc_auc": float(roc_auc_score(y_test, y_prob)),
	  "row_count_train": int(len(X_train)),
	  "row_count_test": int(len(X_test))
	}
	
	ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
	
	joblib.dump(model, str(MODEL_PATH))
	
	metadata = {
	  "model_version": MODEL_VERSION,
	  "trained_at_utc": datetime.utcnow().isoformat(),
	  "feature_list": feature_cols,
	  "label": label_col,
	  "warehouse_table": "modeling_orders",
	  "warehouse_rows": int(len(df))
	}
	
	with open(MODEL_METADATA_PATH, "w", encoding="utf-8") as f:
	  json.dump(metadata, f, indent=2)
	
	with open(METRICS_PATH, "w", encoding="utf-8") as f:
	  json.dump(metrics, f, indent=2)
	
	print("Training complete.")
	print(f"Saved model: {MODEL_PATH}")
	print(f"Saved metadata: {MODEL_METADATA_PATH}")
	print(f"Saved metrics: {METRICS_PATH}")

if __name__ == "__main__":
	train_and_save()
```
#### Job 3: Run Inference and Write Predictions to `shop.db`
- Loads the latest saved model and generates predictions for unfulfilled orders
- Writes predictions to a dedicated table keyed by `order_id`

```python
# jobs/run_inference.py
import pandas as pd
import joblib
from datetime import datetime

from config import OP_DB_PATH, MODEL_PATH
from utils_db import sqlite_conn, ensure_predictions_table

def run_inference():
	model = joblib.load(str(MODEL_PATH))
	
	with sqlite_conn(OP_DB_PATH) as conn:
	  query = """
	  SELECT
		o.order_id,
		o.num_items,
		o.total_value,
		o.avg_weight,
		o.order_timestamp,
		c.birthdate
	  FROM orders o
	  JOIN customers c ON o.customer_id = c.customer_id
	  WHERE o.fulfilled = 0
	  """
	  df_live = pd.read_sql(query, conn)
	
	df_live["order_timestamp"] = pd.to_datetime(df_live["order_timestamp"], errors="coerce")
	df_live["birthdate"] = pd.to_datetime(df_live["birthdate"], errors="coerce")
	
	now_year = datetime.now().year
	df_live["customer_age"] = now_year - df_live["birthdate"].dt.year
	
	df_live["order_dow"] = df_live["order_timestamp"].dt.dayofweek
	df_live["order_month"] = df_live["order_timestamp"].dt.month
	
	X_live = df_live[["num_items", "total_value", "avg_weight", "customer_age", "order_dow", "order_month"]]
	
	probs = model.predict_proba(X_live)[:, 1]
	preds = model.predict(X_live)
	
	ts = datetime.utcnow().isoformat()
	out_rows = [(int(oid), float(p), int(yhat), ts) for oid, p, yhat in zip(df_live["order_id"], probs, preds)]
	
	with sqlite_conn(OP_DB_PATH) as conn:
	  ensure_predictions_table(conn)
	  cur = conn.cursor()
	  cur.executemany("""
	  INSERT OR REPLACE INTO order_predictions
	  (order_id, late_delivery_probability, predicted_late_delivery, prediction_timestamp)
	  VALUES (?, ?, ?, ?)
	  """, out_rows)
	  conn.commit()
	
	print(f"Inference complete. Predictions written: {len(out_rows)}")

if __name__ == "__main__":
	run_inference()
```
### Running Scripts Automatically
#### Timed Processes
- Realistic example
	- ETL runs every night (build modeling table)
	- Training runs every night after ETL
	- Inference runs every few minutes (keeping predictions fresh)
#### Cron Scheduling
```
# Nightly ETL at 1:00am
0 1 * * * cd /path/to/project && /path/to/venv/bin/python jobs/etl_build_warehouse.py >> logs/etl.log 2>&1

# Nightly training at 1:10am
10 1 * * * cd /path/to/project && /path/to/venv/bin/python jobs/train_model.py >> logs/train.log 2>&1

# Inference every 5 minutes
*/5 * * * * cd /path/to/project && /path/to/venv/bin/python jobs/run_inference.py >> logs/infer.log 2>&1
```
