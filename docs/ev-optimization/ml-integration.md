# Machine Learning Integration Guide

## 1. Overview

The machine learning prediction service is encapsulated in `ml-service/`. It operates on **FastAPI** (port `8001`) with modular endpoints for **Range Prediction** (`/predict/range`) and **Queue Prediction** (`/predict/queue`).

---

## 2. Google Colab Workflow to Deploy Trained Models

The machine learning models are trained separately in Google Colab notebooks (using research datasets).

### Step 1: Model Training in Google Colab
Train your Scikit-Learn / XGBoost / Keras models for range regression and queue prediction.

```python
# In Google Colab:
import joblib
from sklearn.ensemble import RandomForestRegressor

# Train range model on EV driving dataset
range_model = RandomForestRegressor(n_estimators=100, random_state=42)
range_model.fit(X_train, y_train)

# Export trained model artifact
joblib.dump(range_model, "ev_range_rf_model.joblib")
```

### Step 2: Place Exported Artifacts into the Repository

Simply copy the exported `.joblib` or `.pkl` files into the designated drop-in directories:

1. **Range Model**:
   Place file into:
   ```
   ml-service/saved_models/range/ev_range_rf_model.joblib
   ```

2. **Queue Model**:
   Place file into:
   ```
   ml-service/saved_models/queue/ev_queue_rf_model.joblib
   ```

### Step 3: Automatic Model Detection
On server startup, `RangeModelLoader` and `QueueModelLoader` scan their respective directories:
- If a model file exists, it is loaded into memory automatically.
- All predictions immediately switch from `"source": "mock"` to `"source": "trained-model"`.
- **Zero code changes** are needed in the backend or frontend!

---

## 3. Fallback Predictors

If no model file is present in `saved_models/`, the service seamlessly falls back to empirical physics calculations:
- **Range Predictor**: Usable energy ($E = \text{Capacity} \times \text{SoC}$) divided by temperature-corrected and aerodynamic speed-adjusted consumption.
- **Queue Predictor**: $M/M/c$ queuing theory approximations based on historical peak hours, arrival time, and stall counts.
