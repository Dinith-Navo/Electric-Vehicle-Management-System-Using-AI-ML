"""
SmartEV - Charging Station Queue Prediction Model Training Pipeline
Student ID: IT22134080
Component: Intelligent EV Charging Optimization & Range Prediction

This script trains baseline (MultiOutput Ridge) and advanced (MultiOutput Random Forest)
regressors for station queue length and wait time prediction, calculates actual evaluation
metrics (MAE, RMSE), selects the champion model based on overall RMSE minimization,
and exports the champion model and its actual metrics to `saved_models/queue/`.
"""

import os
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import Ridge
from sklearn.multioutput import MultiOutputRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error
import joblib


def train_and_export_queue_model():
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    data_path = os.path.join(base_dir, "datasets", "raw", "ev_station_queue_sample.csv")
    output_dir = os.path.join(base_dir, "saved_models", "queue")
    os.makedirs(output_dir, exist_ok=True)

    print("==================================================")
    print(" SmartEV: Training Station Queue Prediction Model")
    print("==================================================")

    # 1. Dataset Existence Validation
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset file not found at: {data_path}")

    df = pd.read_csv(data_path)

    # 2. Empty & Insufficient Sample Size Validation
    if df.empty:
        raise ValueError("Dataset is empty. Cannot train queue prediction model.")

    if len(df) < 5:
        raise ValueError(f"Insufficient training data: Found {len(df)} records, minimum 5 required.")

    feature_cols = [
        "total_chargers",
        "currently_occupied",
        "arrival_hour",
        "day_of_week",
        "charging_speed_kw",
        "avg_session_minutes"
    ]
    target_cols = ["queue_length", "wait_minutes"]

    # 3. Missing Columns Validation
    required_cols = feature_cols + target_cols
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        raise ValueError(f"Dataset is missing required columns: {missing_cols}")

    # 4. Null & Negative Value Validation
    if df[feature_cols].isnull().any().any():
        raise ValueError("Feature columns contain missing (NaN) values.")

    if df[target_cols].isnull().any().any():
        raise ValueError("Target columns contain missing (NaN) values.")

    if (df["queue_length"] < 0).any():
        raise ValueError("Target column 'queue_length' contains invalid negative values.")

    if (df["wait_minutes"] < 0).any():
        raise ValueError("Target column 'wait_minutes' contains invalid negative values.")

    print(f"Loaded dataset successfully: {df.shape[0]} rows, {df.shape[1]} columns")

    X = df[feature_cols]
    y = df[target_cols]

    # Train / Test split with fixed random seed for reproducible research evaluation
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

    # 1. Baseline Model: MultiOutput Ridge Regression
    baseline = MultiOutputRegressor(Ridge(alpha=1.0))
    baseline.fit(X_train, y_train)
    y_pred_base = baseline.predict(X_test)

    mae_q_base = mean_absolute_error(y_test["queue_length"], y_pred_base[:, 0])
    rmse_q_base = np.sqrt(mean_squared_error(y_test["queue_length"], y_pred_base[:, 0]))
    mae_w_base = mean_absolute_error(y_test["wait_minutes"], y_pred_base[:, 1])
    rmse_w_base = np.sqrt(mean_squared_error(y_test["wait_minutes"], y_pred_base[:, 1]))

    # Overall RMSE across targets: (RMSE_queue + RMSE_wait) / 2
    overall_rmse_base = (rmse_q_base + rmse_w_base) / 2.0

    print("\n--- Baseline Model: MultiOutput Ridge Regression ---")
    print(f"Queue Length -> MAE: {mae_q_base:.2f} cars | RMSE: {rmse_q_base:.2f} cars")
    print(f"Wait Time    -> MAE: {mae_w_base:.2f} mins | RMSE: {rmse_w_base:.2f} mins")
    print(f"Overall RMSE -> {overall_rmse_base:.2f}")

    # 2. Advanced Model: MultiOutput Random Forest Regressor
    rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
    rf_model.fit(X_train, y_train)
    y_pred_rf = rf_model.predict(X_test)

    mae_q_rf = mean_absolute_error(y_test["queue_length"], y_pred_rf[:, 0])
    rmse_q_rf = np.sqrt(mean_squared_error(y_test["queue_length"], y_pred_rf[:, 0]))
    mae_w_rf = mean_absolute_error(y_test["wait_minutes"], y_pred_rf[:, 1])
    rmse_w_rf = np.sqrt(mean_squared_error(y_test["wait_minutes"], y_pred_rf[:, 1]))

    # Overall RMSE across targets: (RMSE_queue + RMSE_wait) / 2
    overall_rmse_rf = (rmse_q_rf + rmse_w_rf) / 2.0

    print("\n--- Advanced Model: Random Forest Regressor ---")
    print(f"Queue Length -> MAE: {mae_q_rf:.2f} cars | RMSE: {rmse_q_rf:.2f} cars")
    print(f"Wait Time    -> MAE: {mae_w_rf:.2f} mins | RMSE: {rmse_w_rf:.2f} mins")
    print(f"Overall RMSE -> {overall_rmse_rf:.2f}")

    # 3. Champion Model Selection (Lower Overall RMSE rule)
    if overall_rmse_rf <= overall_rmse_base:
        champion_model = rf_model
        champion_name = "MultiOutputRandomForestRegressor"
        champion_metrics = {
            "queue_length_mae": round(float(mae_q_rf), 4),
            "queue_length_rmse": round(float(rmse_q_rf), 4),
            "wait_minutes_mae": round(float(mae_w_rf), 4),
            "wait_minutes_rmse": round(float(rmse_w_rf), 4),
            "overall_rmse": round(float(overall_rmse_rf), 4)
        }
    else:
        champion_model = baseline
        champion_name = "MultiOutputRidgeRegression"
        champion_metrics = {
            "queue_length_mae": round(float(mae_q_base), 4),
            "queue_length_rmse": round(float(rmse_q_base), 4),
            "wait_minutes_mae": round(float(mae_w_base), 4),
            "wait_minutes_rmse": round(float(rmse_w_base), 4),
            "overall_rmse": round(float(overall_rmse_base), 4)
        }

    print(f"\nChampion Selection Rule: Overall RMSE RF ({overall_rmse_rf:.2f}) <= Overall RMSE Base ({overall_rmse_base:.2f}) -> {overall_rmse_rf <= overall_rmse_base}")
    print(f"Selected Champion Model: {champion_name}")

    # 4. Export Champion Model (Exactly once)
    export_path = os.path.join(output_dir, "ev_queue_model.joblib")
    joblib.dump(champion_model, export_path)
    print(f"\n[OK] Successfully exported champion model ({champion_name}) to {export_path}")

    # 5. Export Champion Metadata (Exactly once)
    metadata = {
        "model_name": champion_name,
        "features": feature_cols,
        "targets": target_cols,
        "metrics": champion_metrics,
        "author": "IT22134080",
        "sample_size": len(df),
        "note": "Metrics computed from research sample dataset (N=11); indicative benchmark."
    }

    meta_path = os.path.join(output_dir, "model_metadata.json")
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"[OK] Exported champion metadata to: {meta_path}")

    return {
        "champion_name": champion_name,
        "export_path": export_path,
        "meta_path": meta_path,
        "metadata": metadata
    }


if __name__ == "__main__":
    train_and_export_queue_model()
