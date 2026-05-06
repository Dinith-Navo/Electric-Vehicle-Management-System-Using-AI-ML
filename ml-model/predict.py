import sys
import pickle
import json
import os
import numpy as np

def predict():
    # Load model
    model_path = os.path.join(os.path.dirname(__file__), 'soc_model.pkl')
    if not os.path.exists(model_path):
        print(json.dumps({"success": False, "error": "Model file not found"}))
        return

    try:
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Features: voltage, current, temperature
        features = np.array([[
            input_data.get('voltage', 380),
            input_data.get('current', 0),
            input_data.get('temperature', 25)
        ]])
        
        prediction = model.predict(features)
        
        print(json.dumps({
            "success": True,
            "predicted_soc": round(float(prediction[0]), 2)
        }))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    predict()
