import pickle
import sys
import numpy as np

# Mocking numpy.random._pcg64 to handle the BitGenerator error
class MockPCG64:
    def __init__(self, *args, **kwargs):
        pass
    def __setstate__(self, state):
        pass

import numpy.random
if not hasattr(numpy.random, '_pcg64'):
    import types
    numpy.random._pcg64 = types.ModuleType('numpy.random._pcg64')
numpy.random._pcg64.PCG64 = MockPCG64

def main():
    path = r'c:\VSCODE_CAPSTONE\Capstone_Phase2\complexity_predictor\complexity_predictor.pkl'
    try:
        with open(path, 'rb') as f:
            data = pickle.load(f)
        
        print("Successfully loaded pickle file.")
        print(f"Top-level type: {type(data)}")
        if isinstance(data, dict):
            print(f"Keys: {list(data.keys())}")
            if 'models' in data:
                print(f"Models keys: {list(data['models'].keys())}")
                for k, v in data['models'].items():
                    print(f"Model '{k}' type: {type(v)}")
        else:
            print(f"Data: {data}")
            
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
