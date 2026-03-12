import os
import pickle
import numpy as np
import sklearn
import sys
import joblib

# Detailed mapping for pickle
class CustomUnpickler(pickle.Unpickler):
    def find_class(self, module, name):
        # Map old numpy path to new one
        if module == 'numpy.random._pcg64' and name == 'PCG64':
            return np.random.PCG64
        # Map old sklearn hist_gradient_boosting
        if 'sklearn.ensemble._hist_gradient_boosting' in module:
            # Try to import from current sklearn
            import sklearn.ensemble._hist_gradient_boosting as hgb
            return getattr(hgb, name)
        
        try:
            return super().find_class(module, name)
        except Exception:
            # Try to handle some common sklearn splits/renames
            if 'sklearn' in module:
                print(f"DEBUG: Failed to find {module}.{name}, attempting fallbacks...")
            raise

model_path = r'c:\VSCODE_CAPSTONE\Capstone_Phase2\complexity_predictor\complexity_predictor.pkl'

if not os.path.exists(model_path):
    print(f"Error: {model_path} not found")
else:
    try:
        with open(model_path, 'rb') as f:
            unpickler = CustomUnpickler(f)
            model = unpickler.load()
        print("Model loaded successfully with CustomUnpickler!")
        print(f"Model type: {type(model)}")
        
        # Test it if possible
        if hasattr(model, 'feature_names_in_'):
            print(f"Features in: {model.feature_names_in_}")
            
    except Exception as e:
        print(f"CustomUnpickler failed: {e}")
        import traceback
        traceback.print_exc()
