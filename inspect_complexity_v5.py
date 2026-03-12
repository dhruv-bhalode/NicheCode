import sys
import types
import numpy.random
import os
import pickle
import sklearn
import sklearn.ensemble

# 1. Mock the missing module path
mock_mod = types.ModuleType('numpy.random._pcg64')
mock_mod.PCG64 = numpy.random.PCG64
sys.modules['numpy.random._pcg64'] = mock_mod

# 2. Mock the older sklearn submodule path
mock_sk = types.ModuleType('sklearn.ensemble._hist_gradient_boosting.gradient_boosting')
# HistGradientBoostingClassifier/Regressor might be in the parent module or this one
import sklearn.ensemble._hist_gradient_boosting
for attr in dir(sklearn.ensemble._hist_gradient_boosting):
    setattr(mock_sk, attr, getattr(sklearn.ensemble._hist_gradient_boosting, attr))

# If they are in sklearn.ensemble, put them there too
for attr in ['HistGradientBoostingClassifier', 'HistGradientBoostingRegressor']:
    if hasattr(sklearn.ensemble, attr):
        setattr(mock_sk, attr, getattr(sklearn.ensemble, attr))

sys.modules['sklearn.ensemble._hist_gradient_boosting.gradient_boosting'] = mock_sk

# Now try to load
model_path = r'c:\VSCODE_CAPSTONE\Capstone_Phase2\complexity_predictor\complexity_predictor.pkl'

print(f"NumPy: {numpy.__version__}")
print(f"sklearn: {sklearn.__version__}")

try:
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    print("SUCCESS: Model loaded with manual mock!")
    print(f"Model type: {type(model)}")
    
    if hasattr(model, 'feature_names_in_'):
        print(f"Features: {list(model.feature_names_in_)}")
    if hasattr(model, 'n_features_in_'):
        print(f"Num features: {model.n_features_in_}")
    if hasattr(model, 'classes_'):
        print(f"Classes: {model.classes_}")

except Exception as e:
    print(f"FAILED: {e}")
    import traceback
    traceback.print_exc()
