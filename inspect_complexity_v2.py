import os
import pickle
import numpy as np
import sklearn
import sys

# Monkey patch or custom Unpickler to handle NumPy version differences
class CustomUnpickler(pickle.Unpickler):
    def find_class(self, module, name):
        if module == 'numpy.random._pcg64' and name == 'PCG64':
            import numpy.random
            return numpy.random.PCG64
        # Add other mappings if needed
        if 'sklearn' in module:
            # You can try to map old sklearn paths to new ones here if needed
            pass
        return super().find_class(module, name)

model_path = r'c:\VSCODE_CAPSTONE\Capstone_Phase2\complexity_predictor\complexity_predictor.pkl'

print(f"NumPy version: {np.__version__}")
print(f"sklearn version: {sklearn.__version__}")

if not os.path.exists(model_path):
    print(f"Error: {model_path} not found")
else:
    try:
        with open(model_path, 'rb') as f:
            unpickler = CustomUnpickler(f)
            model = unpickler.load()
        print("Model loaded successfully with CustomUnpickler!")
        
        print(f"Model type: {type(model)}")
        
        # Inspect the model
        if hasattr(model, 'feature_names_in_'):
            print(f"Features in: {model.feature_names_in_}")
        
        if hasattr(model, 'steps'):
            print(f"Pipeline steps: {[step[0] for step in model.steps]}")
            for name, step in model.steps:
                print(f"  Step '{name}': {type(step)}")
                if hasattr(step, 'vocabulary_'):
                    print(f"    Vocabulary size: {len(step.vocabulary_)}")
                if hasattr(step, 'classes_'):
                    print(f"    Classes: {step.classes_}")

        # If it's a standalone model
        if hasattr(model, 'classes_'):
            print(f"Model Classes: {model.classes_}")
            
    except Exception as e:
        print(f"CustomUnpickler failed: {e}")
        import traceback
        traceback.print_exc()
