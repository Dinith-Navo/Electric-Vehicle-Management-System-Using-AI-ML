# 📈 SmartEV: Research Experimental Results & Scientific Benchmarks
### Component 4: Intelligent EV Charging Optimization and Range Prediction System
**Student ID**: IT22134080  
**Branch**: `feature/ev-optimization`

---

## 1️⃣ Dataset Profiles & Characterization

All models were evaluated on the benchmark datasets located in `ml-service/datasets/raw/`.

| Dataset Name | Target Variables | Records ($N$) | Input Features | Origin & Nature |
| :--- | :--- | :---: | :---: | :--- |
| **EV Driving Range Dataset** | `remaining_range_km` | 20 | `soc`, `battery_capacity_kwh`, `speed_kmh`, `temperature_c`, `energy_consumption_kwh_per_100km` | Initial synthetic domain-approximated benchmark dataset created for pipeline verification. |
| **Charging Station Queue Dataset** | `queue_length`, `wait_minutes` | 11 | `total_chargers`, `currently_occupied`, `arrival_hour`, `day_of_week`, `charging_speed_kw`, `avg_session_minutes` | Initial cross-sectional queuing simulation dataset based on $M/M/c$ queuing theory approximations. |

---

## 2️⃣ Range Prediction Experimental Results

Evaluated on an independent $25\%$ hold-out test set ($N_{\text{test}} = 5$, $N_{\text{train}} = 15$, `random_state=42`):

| Model Architecture | Test MAE (km) | Test RMSE (km) | Test $R^2$ Score | Training Time (ms) | Selection Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Linear Regression (Baseline)** | `8.0697` | `10.8125` | `0.9925` | `1.19 ms` | Evaluated |
| **Ridge Regression (Regularized)** | **`7.7185`** | **`10.7015`** | **`0.9927`** | **`0.96 ms`** | 🏆 **CHAMPION** |
| **Random Forest Regressor** | `37.9834` | `49.2332` | `0.8446` | `80.49 ms` | Evaluated |
| **Gradient Boosting Regressor** | `50.0683` | `57.4954` | `0.7881` | `27.23 ms` | Evaluated |

### 🔬 Scientific Investigation of Range Prediction Metrics ($R^2 = 0.9927$)
* **Target Leakage Check**: Confirmed that `remaining_range_km` is strictly excluded from feature inputs. Preprocessing and splitting occur prior to model fitting.
* **Underlying Relationship**: In physical energy modeling, remaining range has a strong proportional relationship with battery capacity and state of charge:
  $$\text{Usable Energy (kWh)} = \text{Capacity} \times \frac{\text{SoC}}{100}, \quad \text{Range (km)} \approx \frac{\text{Usable Energy}}{\text{Effective Consumption}} \times 100$$
* **Synthetic Data Limitation**: In this initial 20-sample dataset, values follow this physical formulation with low stochastic noise. Linear models (Ridge, Linear Regression) fit this relationship smoothly. Decision tree ensembles (Random Forest, Gradient Boosting) suffer from discrete binning artifacts on very small sample sizes ($N=15$).
* **Real-World Generalization Caveat**: While $R^2 = 0.9927$ correctly reflects model fit on this synthetic test set, it should not be interpreted as evidence of real-world generalization across noisy, stochastic driving cycles. Real-world fleet data with wind, elevation, and aggressive driver behavior will introduce natural variance and lower empirical $R^2$ scores.

---

## 3️⃣ Queue & Wait Time Prediction Experimental Results

Evaluated on an independent $25\%$ hold-out test set ($N_{\text{test}} = 3$, $N_{\text{train}} = 8$, `random_state=42`):

| Model Architecture | Queue Length MAE | Queue Length RMSE | Wait Time MAE | Wait Time RMSE | Overall Mean RMSE | Selection Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **MultiOutput Ridge (Baseline)** | `0.8117` cars | `0.9309` cars | `11.4652` mins | `13.9407` mins | `7.4358` | Evaluated |
| **MultiOutput Random Forest** | `0.8167` cars | `0.8506` cars | `14.3333` mins | `14.8343` mins | `7.8424` | Evaluated |
| **MultiOutput Gradient Boosting** | **`0.6667` cars** | **`0.8165` cars** | **`7.8805` mins** | **`9.4747` mins** | **`5.1456`** | 🏆 **CHAMPION** |

### 🔬 Scientific Selection Criterion
* **Selection Metric**: Minimum Overall Mean RMSE across both targets ($\text{Overall RMSE} = \frac{\text{RMSE}_{\text{queue}} + \text{RMSE}_{\text{wait}}}{2}$).
* **Winner**: **`MultiOutputGradientBoostingRegressor`** achieved the lowest test-set Overall RMSE ($5.1456 < 7.4358 < 7.8424$) and is exported as the production champion model.
* **Dataset Structure Assessment**: The queue dataset consists of 11 cross-sectional records spanning distinct stations at non-consecutive hours. It does not constitute a continuous univariate time-series. Multi-output regression is methodologically appropriate for this structure.

---

## 4️⃣ Research Visualizations

Generated plots are stored under `docs/ev-optimization/results/`:

1. **Range Actual vs. Predicted**: [range_actual_vs_predicted.png](file:///d:/Ev-optimization/Electric-Vehicle-Management-System-Using-AI-ML/docs/ev-optimization/results/range_actual_vs_predicted.png)
2. **Range Residual Distribution**: [range_residuals.png](file:///d:/Ev-optimization/Electric-Vehicle-Management-System-Using-AI-ML/docs/ev-optimization/results/range_residuals.png)
3. **Range Feature Importance**: [range_feature_importance.png](file:///d:/Ev-optimization/Electric-Vehicle-Management-System-Using-AI-ML/docs/ev-optimization/results/range_feature_importance.png)
4. **Range Model Comparison**: [range_model_comparison.png](file:///d:/Ev-optimization/Electric-Vehicle-Management-System-Using-AI-ML/docs/ev-optimization/results/range_model_comparison.png)
5. **Queue Actual vs. Predicted**: [queue_actual_vs_predicted.png](file:///d:/Ev-optimization/Electric-Vehicle-Management-System-Using-AI-ML/docs/ev-optimization/results/queue_actual_vs_predicted.png)
6. **Queue Model Comparison**: [queue_model_comparison.png](file:///d:/Ev-optimization/Electric-Vehicle-Management-System-Using-AI-ML/docs/ev-optimization/results/queue_model_comparison.png)
7. **Diurnal Queue Profile**: [queue_diurnal_forecast.png](file:///d:/Ev-optimization/Electric-Vehicle-Management-System-Using-AI-ML/docs/ev-optimization/results/queue_diurnal_forecast.png)

---

## 5️⃣ Genuine Research Limitations

1. **Sample Size Scope**: The current datasets ($N=20$ and $N=11$) serve as initial pipeline verification samples. They validate software correctness, API contracts, model loaders, and training pipelines.
2. **Synthetic Data Origin**: Dataset records were generated from physical formulas and queuing approximations rather than live CAN-bus sensors or hardware charging station telemetry.
3. **Lack of Stochastic Noise**: Real-world driving cycles (WLTP/EPA variance, driver aggressiveness, traffic stop-and-go, headwinds, battery SOH degradation) will introduce stochastic noise in future empirical testing.
4. **Temporal Continuity**: The queue dataset lacks high-frequency consecutive temporal logging ($5$-minute interval feeds).
