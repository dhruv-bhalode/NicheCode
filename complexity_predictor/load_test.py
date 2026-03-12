import sys
import types
import numpy.random

# Mock the missing module
m = types.ModuleType('numpy.random._pcg64')
m.PCG64 = numpy.random.PCG64
sys.modules['numpy.random._pcg64'] = m

import joblib
import pickle
import numpy as np

model_path = r'c:\VSCODE_CAPSTONE\Capstone_Phase2\complexity_predictor\complexity_predictor.pkl'

try:
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    print(f"Loaded with pickle: {type(model)}")
except Exception as e:
    print(f"Pickle failed: {e}")
    import traceback
    traceback.print_exc()

try:
    model = joblib.load(model_path)
    print(f"Loaded with joblib: {type(model)}")
except Exception as e:
    print(f"Joblib failed: {e}")
