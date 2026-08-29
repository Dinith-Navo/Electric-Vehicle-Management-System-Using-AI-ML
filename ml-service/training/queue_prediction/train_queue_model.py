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
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
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
    overall_rmse_base = (rmse_q_base + rmse_w_base) / 2.0

    print("\n--- Model 1: MultiOutput Ridge Regression (Baseline) ---")
    print(f"Queue Length -> MAE: {mae_q_base:.2f} cars | RMSE: {rmse_q_base:.2f} cars")
    print(f"Wait Time    -> MAE: {mae_w_base:.2f} mins | RMSE: {rmse_w_base:.2f} mins")
    print(f"Overall Mean RMSE -> {overall_rmse_base:.2f}")

    # 2. Advanced Model 1: MultiOutput Random Forest Regressor
    rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
    rf_model.fit(X_train, y_train)
    y_pred_rf = rf_model.predict(X_test)

    mae_q_rf = mean_absolute_error(y_test["queue_length"], y_pred_rf[:, 0])
    rmse_q_rf = np.sqrt(mean_squared_error(y_test["queue_length"], y_pred_rf[:, 0]))
    mae_w_rf = mean_absolute_error(y_test["wait_minutes"], y_pred_rf[:, 1])
    rmse_w_rf = np.sqrt(mean_squared_error(y_test["wait_minutes"], y_pred_rf[:, 1]))
    overall_rmse_rf = (rmse_q_rf + rmse_w_rf) / 2.0

    print("\n--- Model 2: MultiOutput Random Forest Regressor ---")
    print(f"Queue Length -> MAE: {mae_q_rf:.2f} cars | RMSE: {rmse_q_rf:.2f} cars")
    print(f"Wait Time    -> MAE: {mae_w_rf:.2f} mins | RMSE: {rmse_w_rf:.2f} mins")
    print(f"Overall Mean RMSE -> {overall_rmse_rf:.2f}")

    # 3. Advanced Model 2: MultiOutput Gradient Boosting Regressor
    gbm_model = MultiOutputRegressor(GradientBoostingRegressor(n_estimators=100, random_state=42))
    gbm_model.fit(X_train, y_train)
    y_pred_gbm = gbm_model.predict(X_test)

    mae_q_gbm = mean_absolute_error(y_test["queue_length"], y_pred_gbm[:, 0])
    rmse_q_gbm = np.sqrt(mean_squared_error(y_test["queue_length"], y_pred_gbm[:, 0]))
    mae_w_gbm = mean_absolute_error(y_test["wait_minutes"], y_pred_gbm[:, 1])
    rmse_w_gbm = np.sqrt(mean_squared_error(y_test["wait_minutes"], y_pred_gbm[:, 1]))
    overall_rmse_gbm = (rmse_q_gbm + rmse_w_gbm) / 2.0

    print("\n--- Model 3: MultiOutput Gradient Boosting Regressor ---")
    print(f"Queue Length -> MAE: {mae_q_gbm:.2f} cars | RMSE: {rmse_q_gbm:.2f} cars")
    print(f"Wait Time    -> MAE: {mae_w_gbm:.2f} mins | RMSE: {rmse_w_gbm:.2f} mins")
    print(f"Overall Mean RMSE -> {overall_rmse_gbm:.2f}")

    # 4. Champion Model Selection (Lowest Overall Mean RMSE rule)
    candidates = [
        ("MultiOutputRidgeRegression", baseline, mae_q_base, rmse_q_base, mae_w_base, rmse_w_base, overall_rmse_base),
        ("MultiOutputRandomForestRegressor", rf_model, mae_q_rf, rmse_q_rf, mae_w_rf, rmse_w_rf, overall_rmse_rf),
        ("MultiOutputGradientBoostingRegressor", gbm_model, mae_q_gbm, rmse_q_gbm, mae_w_gbm, rmse_w_gbm, overall_rmse_gbm)
    ]
    # Sort ascending by overall_rmse
    candidates.sort(key=lambda x: x[6])
    best_name, champion_model, best_mq, best_rq, best_mw, best_rw, best_overall_rmse = candidates[0]

    champion_name = best_name
    champion_metrics = {
        "queue_length_mae": round(float(best_mq), 4),
        "queue_length_rmse": round(float(best_rq), 4),
        "wait_minutes_mae": round(float(best_mw), 4),
        "wait_minutes_rmse": round(float(best_rw), 4),
        "overall_rmse": round(float(best_overall_rmse), 4)
    }

    print(f"\nChampion Selection Rule: Minimum Overall RMSE -> {champion_name} (Overall RMSE: {best_overall_rmse:.2f})")
    print(f"Selected Champion Model: {champion_name}")

    # 5. Export Champion Model (Exactly once)
    export_path = os.path.join(output_dir, "ev_queue_model.joblib")
    joblib.dump(champion_model, export_path)
    print(f"\n[OK] Successfully exported champion model ({champion_name}) to {export_path}")

    # 6. Export Champion Metadata (Exactly once)
    metadata = {
        "model_name": champion_name,
        "features": feature_cols,
        "targets": target_cols,
        "metrics": champion_metrics,
        "author": "IT22134080",
        "sample_size": len(df),
        "test_split_ratio": 0.25,
        "random_state": 42,
        "experiment_date": "2026-08-29",
        "note": "Evaluated on initial sample dataset (N=11) with 25% holdout test set."
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
