import pickle
import numpy as np
from numpy.random import BitGenerator

class MockPCG64(BitGenerator):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
    def __setstate__(self, state):
        pass

import numpy.random._pcg64
numpy.random._pcg64.PCG64 = MockPCG64

def main():
    path = r'c:\VSCODE_CAPSTONE\Capstone_Phase2\complexity_predictor\complexity_predictor.pkl'
    try:
        with open(path, 'rb') as f:
            data = pickle.load(f)
        
        print("Successfully loaded pickle file!")
        print(f"Keys: {list(data.keys())}")
        # If we got here, we can try to inspect the model's feature names
        model = data['models']['optimal_time']
        print(f"Feature count: {model.n_features_in_}")
        if hasattr(model, 'feature_names_in_'):
            print(f"Features: {model.feature_names_in_}")
        else:
            print("No feature names found in model.")
            
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
