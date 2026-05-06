import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
import pickle
import os

# Create ml-model directory if it doesn't exist
if not os.path.exists('models'):
    os.makedirs('models')

def generate_synthetic_data(samples=2000):
    """
    Generates a synthetic dataset for SoC prediction.
    Features: Voltage, Current, Temperature
    Target: SoC (State of Charge)
    """
    np.random.seed(42)
    
    # Voltage: 300V to 420V
    voltage = np.random.uniform(300, 420, samples)
    
    # Current: -100A (Regen) to 300A (Discharge)
    current = np.random.uniform(-100, 300, samples)
    
    # Temperature: -10C to 50C
    temp = np.random.uniform(-10, 50, samples)
    
    # SoC heuristic formula: 
    # High voltage = high SoC. 
    # High temp slightly reduces efficiency/voltage.
    # Current flow affects instantaneous voltage drop.
    soc = ((voltage - 300) / 120) * 100 
    soc += (temp * 0.05) - (current * 0.01)
    soc = np.clip(soc, 0, 100)
    
    # Add some noise
    soc += np.random.normal(0, 1, samples)
    soc = np.clip(soc, 0, 100)
    
    data = pd.DataFrame({
        'voltage': voltage,
        'current': current,
        'temperature': temp,
        'soc': soc
    })
    
    return data

def train_soc_model():
    print("Initializing SoC Prediction Model Training...")
    
    # 1. Prepare Data
    data = generate_synthetic_data()
    X = data[['voltage', 'current', 'temperature']]
    y = data['soc']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # 2. Train Random Forest
    print("Training Random Forest Regressor...")
    model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
    model.fit(X_train, y_train)
    
    # 3. Evaluate
    predictions = model.predict(X_test)
    mae = mean_absolute_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)
    
    print(f"Training Complete!")
    print(f"Metrics: MAE={mae:.4f}, R2 Score={r2:.4f}")
    
    # 4. Save Model
    model_path = os.path.join(os.path.dirname(__file__), 'soc_model.pkl')
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    
    print(f"Model saved to: {model_path}")

if __name__ == "__main__":
    train_soc_model()
