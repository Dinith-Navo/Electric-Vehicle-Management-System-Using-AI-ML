"""
SmartEV - Research Model Evaluation Script
Student ID: IT22134080
Component: Intelligent EV Charging Optimization and Range Prediction System

Produces empirical evaluation tables and metrics (MAE, RMSE, R²) for
academic research paper and dissertation reporting.
"""

import os
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import KFold, cross_val_score
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

def evaluate_all():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    range_data_path = os.path.join(base_dir, "datasets", "raw", "ev_range_dataset_sample.csv")
    queue_data_path = os.path.join(base_dir, "datasets", "raw", "ev_station_queue_sample.csv")

    print("==========================================================================")
    print(" SmartEV Academic Research Evaluation - Component 4 (IT22134080)")
    print("==========================================================================")

    # --- 1. RANGE PREDICTION BENCHMARK ---
    if os.path.exists(range_data_path):
        print("\n--- 1. Range Prediction Benchmark (MAE / RMSE / R2) ---")
        df_r = pd.read_csv(range_data_path)
        feature_cols = ["soc", "battery_capacity_kwh", "speed_kmh", "temperature_c", "energy_consumption_kwh_per_100km"]
        X = df_r[feature_cols]
        y = df_r["remaining_range_km"]

        models = {
            "Linear Regression (Baseline)": LinearRegression(),
            "Ridge Regression": Ridge(alpha=1.0),
            "Gradient Boosting Regressor": GradientBoostingRegressor(n_estimators=100, random_state=42),
            "Random Forest Regressor": RandomForestRegressor(n_estimators=100, random_state=42)
        }

        results = []
        for name, model in models.items():
            model.fit(X, y)
            preds = model.predict(X)
            mae = mean_absolute_error(y, preds)
            rmse = np.sqrt(mean_squared_error(y, preds))
            r2 = r2_score(y, preds)
            results.append({"Model": name, "MAE (km)": round(mae, 2), "RMSE (km)": round(rmse, 2), "R2": round(r2, 4)})

        res_df = pd.DataFrame(results)
        print(res_df.to_string(index=False))

    # --- 2. QUEUE PREDICTION BENCHMARK ---
    if os.path.exists(queue_data_path):
        print("\n--- 2. Queue & Wait Time Benchmark (MAE / RMSE) ---")
        df_q = pd.read_csv(queue_data_path)
        q_features = ["total_chargers", "currently_occupied", "arrival_hour", "day_of_week", "charging_speed_kw", "avg_session_minutes"]
        X_q = df_q[q_features]
        y_q = df_q[["queue_length", "wait_minutes"]]

        rf_q = RandomForestRegressor(n_estimators=100, random_state=42)
        rf_q.fit(X_q, y_q)
        preds_q = rf_q.predict(X_q)

        mae_len = mean_absolute_error(y_q["queue_length"], preds_q[:, 0])
        rmse_len = np.sqrt(mean_squared_error(y_q["queue_length"], preds_q[:, 0]))
        mae_wait = mean_absolute_error(y_q["wait_minutes"], preds_q[:, 1])
        rmse_wait = np.sqrt(mean_squared_error(y_q["wait_minutes"], preds_q[:, 1]))

        print(f"Random Forest Queue Length -> MAE: {mae_len:.2f} cars | RMSE: {rmse_len:.2f} cars")
        print(f"Random Forest Wait Time    -> MAE: {mae_wait:.2f} mins | RMSE: {rmse_wait:.2f} mins")

    print("\n[OK] Evaluation complete. Results ready for thesis/paper compilation.")

if __name__ == "__main__":
    evaluate_all()
