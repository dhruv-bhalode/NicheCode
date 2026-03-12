import joblib
import os
import pandas as pd
from complexity_extractor import CodeFeatureExtractor

MODEL_PATH = r"C:\Users\kshit\Downloads\complexity_predictor_disha.pkl"

class ComplexityService:
    def __init__(self):
        self.model_data = None
        self.extractor = None
        self.load_model()

    def load_model(self):
        if not os.path.exists(MODEL_PATH):
            print(f"Error: Model file not found at {MODEL_PATH}")
            return

        try:
            self.model_data = joblib.load(MODEL_PATH)
            self.extractor = CodeFeatureExtractor(self.model_data['feature_names'])
            print("Complexity model loaded successfully.")
        except Exception as e:
            print(f"Failed to load complexity model: {e}")

    def predict(self, code, problem_metadata=None):
        if not self.model_data:
            return {"error": "Model not loaded"}

        features_dict = self.extractor.extract(code, problem_metadata)
        features_df = pd.DataFrame([features_dict])[self.model_data['feature_names']]

        predictions = {}
        for target, model in self.model_data['models'].items():
            pred = model.predict(features_df)
            # Use the encoder (LabelEncoder) to get the original class label
            encoder = self.model_data['encoders'][target]
            decoded_pred = encoder.inverse_transform(pred)[0]
            predictions[target] = decoded_pred

        return predictions

# Singleton instance
complexity_service = ComplexityService()
