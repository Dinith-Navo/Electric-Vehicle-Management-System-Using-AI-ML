"""
SmartEV - Range Prediction Model Training Pipeline
Student ID: IT22134080
Component: Intelligent EV Charging Optimization & Range Prediction

This script trains baseline (Ridge Regression) and advanced (Random Forest Regressor)
models on EV telemetry data, calculates actual evaluation metrics (MAE, RMSE, R²),
selects the champion model based on R² score, and exports the model and corresponding
champion metrics to `saved_models/range/`.
"""

import os
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib


def train_and_export_range_model():
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    data_path = os.path.join(base_dir, "datasets", "raw", "ev_range_dataset_sample.csv")
    output_dir = os.path.join(base_dir, "saved_models", "range")
    os.makedirs(output_dir, exist_ok=True)

    print("==================================================")
    print(" SmartEV: Training EV Range Prediction Model")
    print("==================================================")

    # 1. Dataset Existence Validation
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset file not found at: {data_path}")

    df = pd.read_csv(data_path)

    # 2. Empty & Insufficient Data Validation
    if df.empty:
        raise ValueError("Dataset is empty. Cannot train range prediction model.")

    if len(df) < 5:
        raise ValueError(f"Insufficient training data: Found {len(df)} records, minimum 5 required.")

    feature_cols = [
        "soc",
        "battery_capacity_kwh",
        "speed_kmh",
        "temperature_c",
        "energy_consumption_kwh_per_100km"
    ]
    target_col = "remaining_range_km"

    # 3. Missing Required Columns Validation
    required_cols = feature_cols + [target_col]
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        raise ValueError(f"Dataset is missing required columns: {missing_cols}")

    # 4. Target & Feature Data Validity Validation
    if df[target_col].isnull().any():
        raise ValueError(f"Target column '{target_col}' contains missing (NaN) values.")

    if (df[target_col] <= 0).any():
        raise ValueError(f"Target column '{target_col}' contains invalid non-positive values.")

    if df[feature_cols].isnull().any().any():
        raise ValueError("Feature columns contain missing (NaN) values.")

    print(f"Loaded dataset successfully: {df.shape[0]} rows, {df.shape[1]} columns")

    X = df[feature_cols]
    y = df[target_col]

    # Train / Test split with fixed random seed for reproducible research evaluation
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

    # 1. Baseline 1: Linear Regression
    lr = LinearRegression()
    lr.fit(X_train, y_train)
    y_pred_lr = lr.predict(X_test)
    mae_lr = mean_absolute_error(y_test, y_pred_lr)
    rmse_lr = np.sqrt(mean_squared_error(y_test, y_pred_lr))
    r2_lr = r2_score(y_test, y_pred_lr)
    print(f"\nModel 1: Linear Regression (Baseline)  -> MAE: {mae_lr:.2f} km | RMSE: {rmse_lr:.2f} km | R2: {r2_lr:.4f}")

    # 2. Baseline 2: Ridge Regression
    baseline = Ridge(alpha=1.0)
    baseline.fit(X_train, y_train)
    y_pred_base = baseline.predict(X_test)
    mae_base = mean_absolute_error(y_test, y_pred_base)
    rmse_base = np.sqrt(mean_squared_error(y_test, y_pred_base))
    r2_base = r2_score(y_test, y_pred_base)
    print(f"Model 2: Ridge Regression (Regularized)-> MAE: {mae_base:.2f} km | RMSE: {rmse_base:.2f} km | R2: {r2_base:.4f}")

    # 3. Advanced 1: Random Forest Regressor
    rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
    rf_model.fit(X_train, y_train)
    y_pred_rf = rf_model.predict(X_test)
    mae_rf = mean_absolute_error(y_test, y_pred_rf)
    rmse_rf = np.sqrt(mean_squared_error(y_test, y_pred_rf))
    r2_rf = r2_score(y_test, y_pred_rf)
    print(f"Model 3: Random Forest Regressor       -> MAE: {mae_rf:.2f} km | RMSE: {rmse_rf:.2f} km | R2: {r2_rf:.4f}")

    # 4. Advanced 2: Gradient Boosting Regressor
    gbm_model = GradientBoostingRegressor(n_estimators=100, random_state=42)
    gbm_model.fit(X_train, y_train)
    y_pred_gbm = gbm_model.predict(X_test)
    mae_gbm = mean_absolute_error(y_test, y_pred_gbm)
    rmse_gbm = np.sqrt(mean_squared_error(y_test, y_pred_gbm))
    r2_gbm = r2_score(y_test, y_pred_gbm)
    print(f"Model 4: Gradient Boosting Regressor   -> MAE: {mae_gbm:.2f} km | RMSE: {rmse_gbm:.2f} km | R2: {r2_gbm:.4f}")

    # Champion Model Selection (Lowest RMSE / Highest R²)
    candidates = [
        ("LinearRegression", lr, mae_lr, rmse_lr, r2_lr),
        ("RidgeRegression", baseline, mae_base, rmse_base, r2_base),
        ("RandomForestRegressor", rf_model, mae_rf, rmse_rf, r2_rf),
        ("GradientBoostingRegressor", gbm_model, mae_gbm, rmse_gbm, r2_gbm)
    ]
    # Sort by RMSE ascending
    candidates.sort(key=lambda x: x[3])
    champion_name, champion_model, champion_mae, champion_rmse, champion_r2 = candidates[0]

    print(f"\nChampion Selection Rule: Minimum Test-Set RMSE -> {champion_name} (RMSE: {champion_rmse:.2f} km, R2: {champion_r2:.4f})")
    print(f"Selected Champion Model: {champion_name}")

    # Export Champion Model (Exactly once)
    export_path = os.path.join(output_dir, "ev_range_model.joblib")
    joblib.dump(champion_model, export_path)
    print(f"\n[OK] Successfully exported champion model ({champion_name}) to {export_path}")

    # Export Champion Metadata (Exactly once)
    metadata = {
        "model_name": champion_name,
        "features": feature_cols,
        "metrics": {
            "mae": round(float(champion_mae), 4),
            "rmse": round(float(champion_rmse), 4),
            "r2": round(float(champion_r2), 4)
        },
        "target": target_col,
        "author": "IT22134080",
        "sample_size": len(df),
        "test_split_ratio": 0.25,
        "random_state": 42,
        "experiment_date": "2026-08-29",
        "note": "Evaluated on initial sample dataset (N=20) with 25% holdout test set."
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
    train_and_export_range_model()
