# 📊 SmartEV: Research Methodology & Evaluation Framework
### Component 4: Intelligent EV Charging Optimization and Range Prediction System
**Student ID**: IT22134080  
**Branch**: `feature/ev-optimization`

---

## 1. Research Problem Definition

Electric vehicle (EV) adoption faces three core operational challenges:
1. **Range Anxiety & Estimation Variance**: Discrepancies between rated nominal vehicle range and dynamic actual range caused by ambient temperature, driving speed, aerodynamic drag, and climate control (AC) load.
2. **Charging Station Congestion & Queuing**: Inability of EV drivers to anticipate real-time charging stall occupancy, resulting in unexpected wait times at fast chargers.
3. **Sub-Optimal Charging Decision Support**: Lack of multi-criteria recommendation systems that holistically balance station proximity, charging power, tariff pricing, driver reviews, and waiting times.

---

## 2. Research Objectives

1. **RO 1**: Develop a dynamic machine learning pipeline for remaining EV driving range prediction taking into account battery State of Charge (SoC), pack capacity, speed, temperature, and AC consumption.
2. **RO 2**: Formulate a predictive queuing model to forecast charging stall congestion, queue length, and estimated driver wait times.
3. **RO 3**: Design a multi-criteria utility scoring engine to rank available charging hubs according to user priorities.
4. **RO 4**: Implement a corridor route energy optimizer to evaluate journey battery feasibility and recommend optimal corridor charging stops.
5. **RO 5**: Implement a non-linear fast-charging duration estimator modeling constant-current / constant-voltage (CC-CV) taper curves.
6. **RO 6**: Develop a transparent charging session and monthly energy expenditure analytics model comparing EV running costs against internal combustion engine (ICE) petrol vehicles.
7. **RO 7**: Integrate all algorithms into an intuitive, real-time driver assistance mobile dashboard with microservice inference architecture.

---

## 3. Dataset Characterization & Preprocessing

### 3.1 Datasets
* **Range Dataset (`ev_range_dataset_sample.csv`)**: Contains $N=20$ records with features `soc`, `battery_capacity_kwh`, `speed_kmh`, `temperature_c`, `energy_consumption_kwh_per_100km`, and target `remaining_range_km`.
* **Queue Dataset (`ev_station_queue_sample.csv`)**: Contains $N=11$ records with features `total_chargers`, `currently_occupied`, `arrival_hour`, `day_of_week`, `charging_speed_kw`, `avg_session_minutes`, and targets `queue_length`, `wait_minutes`.

### 3.2 Preprocessing & Leakage Prevention
* Features and targets are pre-validated to ensure physical validity ($\text{SoC} \in [0, 100]$, positive capacity, non-negative speeds, non-negative wait times).
* $25\%$ independent hold-out test split is performed with fixed random seed ($42$) before model training, preventing data leakage.

---

## 4. Machine Learning Methodology

### 4.1 Range Prediction Pipeline
* **Baseline**: Ridge Regression with $L_2$ Tikhonov regularization:
  $$\min_{\beta} \|y - X\beta\|_2^2 + \alpha \|\beta\|_2^2$$
* **Advanced Ensembles**: Random Forest Regressor ($N=100$) and Gradient Boosting Regressor ($N=100$).
* **Evaluation Metrics**: Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), and Coefficient of Determination ($R^2$).

### 4.2 Queue Prediction Pipeline
* **Formulation**: Multi-output regression targeting simultaneous prediction of $[ \text{queue\_length}, \text{wait\_minutes} ]$.
* **Baseline**: MultiOutput Ridge Regression.
* **Advanced**: MultiOutput Random Forest Regressor and Gradient Boosting.
* **Queuing Theory Baseline**: $M/M/c$ Queuing model under Poisson arrivals ($\lambda$) and exponential charging service times ($\mu$).

### 4.3 Multi-Criteria Decision Scoring
$$\text{Score}_i = w_d \cdot S_{\text{dist}, i} + w_p \cdot S_{\text{power}, i} + w_c \cdot S_{\text{price}, i} + w_r \cdot S_{\text{rating}, i} + w_a \cdot S_{\text{avail}, i} - w_w \cdot S_{\text{wait}, i}$$
* Configurable default weights: $w_d = 0.30, w_p = 0.20, w_c = 0.15, w_r = 0.15, w_a = 0.10, w_w = 0.10$.

---

## 5. Proposal Alignment & Methodology Evolution

| Research Proposal Initial Concept | Evolved Implementation | Scientific Justification |
| :--- | :--- | :--- |
| **Deep Learning LSTM for Range** | **Regularized Ridge & Random Forest** | For tabular vehicle telemetry at current sample scale, LSTM networks suffer from severe parameter overfitting ($>10^5$ parameters for $N < 10^3$ rows). Linear regularized models and tree ensembles provide superior generalizability, lower latency ($< 1\text{ ms}$ inference), and transparent explainability. |
| **Time-Series ARIMA for Queues** | **MultiOutput Regressors + Diurnal Queuing Curves** | Standard single-station univariate ARIMA models require continuous stationary time-series feeds ($\ge 500$ sequential timestamps) and fail to capture multi-station cross-sectional covariates (stall count, charger speed). Multi-output ML models combined with queuing approximations effectively handle cross-sectional features and diurnal shifts. |

---

## 6. Empirical Test-Set Results Summary

### Range Models:
* **Ridge Regression (Champion)**: $\text{MAE} = 7.72\text{ km}$, $\text{RMSE} = 10.70\text{ km}$, $R^2 = 0.9927$, Training time $= 0.89\text{ ms}$.
* **Random Forest**: $\text{MAE} = 37.98\text{ km}$, $\text{RMSE} = 49.23\text{ km}$, $R^2 = 0.8446$, Training time $= 65.37\text{ ms}$.
* **Gradient Boosting**: $\text{MAE} = 50.07\text{ km}$, $\text{RMSE} = 57.50\text{ km}$, $R^2 = 0.7881$, Training time $= 28.72\text{ ms}$.

### Queue Models:
* **MultiOutput Gradient Boosting (Champion)**: Queue Length $\text{MAE} = 0.67\text{ cars}$, Wait Time $\text{MAE} = 7.88\text{ mins}$, $\text{Overall RMSE} = 5.15$, Training time $= 49.84\text{ ms}$.
* **MultiOutput Ridge**: Queue Length $\text{MAE} = 0.81\text{ cars}$, Wait Time $\text{MAE} = 11.47\text{ mins}$, $\text{Overall RMSE} = 7.44$, Training time $= 3.01\text{ ms}$.
* **MultiOutput Random Forest**: Queue Length $\text{MAE} = 0.82\text{ cars}$, Wait Time $\text{MAE} = 14.33\text{ mins}$, $\text{Overall RMSE} = 7.84$, Training time $= 62.68\text{ ms}$.

---

## 7. Research Limitations & Future Work

1. **Dataset Volume**: The current benchmark dataset is an initial sample ($N=20$ and $N=11$) designed for pipeline verification. Future research will scale to large-scale fleet telemetry ($N > 5000$).
2. **Deterministic Physics**: Simulated data exhibits high linearity; real-world CAN bus streams will introduce non-deterministic stochastic variance (driver aggression, wind turbulence).
3. **Future Extension**: Integration of real-time open charging APIs (e.g. OpenChargeMap) and dynamic traffic feeds for real-time congestion updating.
