# 📊 SmartEV: Research Evaluation Framework & Methodology
### Component 4: Intelligent EV Charging Optimization and Range Prediction System
**Student ID**: IT22134080  
**Branch**: `feature/ev-optimization`

---

## 🎯 Research Objectives & Metrics

This research component develops and evaluates machine learning and decision support algorithms for electric vehicle energy management.

### 1. Range Prediction Evaluation

Evaluates the accuracy of EV driving range estimation across varying driving speeds, ambient temperatures, and AC load conditions.

#### Mathematical Metrics:
- **Mean Absolute Error (MAE)**:
  $$\text{MAE} = \frac{1}{n} \sum_{i=1}^n |y_i - \hat{y}_i|$$
- **Root Mean Squared Error (RMSE)**:
  $$\text{RMSE} = \sqrt{\frac{1}{n} \sum_{i=1}^n (y_i - \hat{y}_i)^2}$$
- **Coefficient of Determination ($R^2$)**:
  $$R^2 = 1 - \frac{\sum_{i=1}^n (y_i - \hat{y}_i)^2}{\sum_{i=1}^n (y_i - \bar{y})^2}$$

#### Candidate Models:
1. **Baseline**: Linear Regression & Ridge Regression ($L_2$ regularized)
2. **Ensemble Trees**: Random Forest Regressor ($N=100$ estimators)
3. **Boosting**: Gradient Boosting Regressor (GBM) / XGBoost

---

### 2. Queue & Wait-Time Prediction Evaluation

Evaluates charging station stall congestion and queuing delay forecasting.

#### Mathematical Metrics:
- **Queue Length MAE / RMSE**: Discrepancy between actual number of queued EVs vs. predicted queue count.
- **Wait Time MAE / RMSE**: Discrepancy in minutes between forecasted wait time and actual charging start time.

#### Formulations:
1. **Queuing Theory Baseline**: $M/M/c$ Queuing model under Poisson arrival ($\lambda$) and exponential charging service times ($\mu$).
2. **Machine Learning Model**: Multi-Output Random Forest Regressor leveraging temporal features (hour of day, day of week, peak vs off-peak).

---

### 3. Multi-Criteria Recommendation Scoring Evaluation

Evaluates the quality of charging station recommendations for EV drivers.

#### Scoring Formula:
$$S_i = w_d \cdot S_{\text{dist}, i} + w_p \cdot S_{\text{power}, i} + w_c \cdot S_{\text{price}, i} + w_r \cdot S_{\text{rating}, i} + w_a \cdot S_{\text{avail}, i} - w_w \cdot S_{\text{wait}, i}$$

Where default configurable weights are:
- $w_d = 0.30$ (Proximity)
- $w_p = 0.20$ (Charging Power)
- $w_c = 0.15$ (Cost Economy)
- $w_r = 0.15$ (Driver Rating)
- $w_a = 0.10$ (Immediate Availability)
- $w_w = 0.10$ (Queue Delay Penalty)

---

## 🔬 Executing Research Evaluation Scripts

To generate empirical evaluation tables for thesis reporting:

```powershell
cd ml-service
python training/evaluate_models.py
```

This outputs comparative tables showing baseline vs. advanced model performance for empirical reporting.
