import os
import pickle
import numpy as np
import sklearn
import sys
import sklearn.ensemble

class CustomUnpickler(pickle.Unpickler):
    def find_class(self, module, name):
        # Handle numpy PCG64
        if 'numpy.random.' in module and name == 'PCG64':
            return np.random.PCG64
            
        # Handle sklearn remapping
        if '_hist_gradient_boosting' in module:
            # Try to find it in sklearn.ensemble
            if hasattr(sklearn.ensemble, name):
                return getattr(sklearn.ensemble, name)
            
        # Standard lookup
        try:
            return super().find_class(module, name)
        except Exception:
            # Fallback for sklearn renames
            if 'sklearn' in module:
                # Try a global search in sklearn
                import importlib
                try:
                    # Try to find where it is now
                    if 'HistGradientBoosting' in name:
                        return getattr(sklearn.ensemble, name)
                except:
                    pass
            raise

model_path = r'c:\VSCODE_CAPSTONE\Capstone_Phase2\complexity_predictor\complexity_predictor.pkl'

if not os.path.exists(model_path):
    print(f"Error: {model_path} not found")
else:
    try:
        with open(model_path, 'rb') as f:
            unpickler = CustomUnpickler(f)
            model = unpickler.load()
        print("Model loaded successfully with CustomUnpickler V4!")
        print(f"Model type: {type(model)}")
        
        # Inspection
        if hasattr(model, 'n_features_in_'):
            print(f"Number of features: {model.n_features_in_}")
        if hasattr(model, 'feature_names_in_'):
            print(f"Feature names: {list(model.feature_names_in_)}")
        if hasattr(model, 'classes_'):
            print(f"Classes: {model.classes_}")
            
    except Exception as e:
        print(f"CustomUnpickler V4 failed: {e}")
        import traceback
        traceback.print_exc()
