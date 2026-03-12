import pickle
import sys
import io

class MockModel:
    def __init__(self, *args, **kwargs):
        self.args = args
        self.kwargs = kwargs
    def __setstate__(self, state):
        self.state = state
    def __getattr__(self, name):
        return None

class RobustUnpickler(pickle.Unpickler):
    def find_class(self, module, name):
        if 'sklearn' in module or 'numpy' in module:
            return MockModel
        return super().find_class(module, name)

def main():
    path = r'c:\VSCODE_CAPSTONE\Capstone_Phase2\complexity_predictor\complexity_predictor.pkl'
    try:
        with open(path, 'rb') as f:
            unpickler = RobustUnpickler(f)
            data = unpickler.load()
        
        print("Successfully loaded pickle file structure (using mocks).")
        if isinstance(data, dict):
            print(f"Keys: {list(data.keys())}")
            if 'models' in data:
                for k, v in data['models'].items():
                    print(f"\nModel '{k}':")
                    if hasattr(v, 'state'):
                        print(f"  State keys: {list(v.state.keys())}")
                        # Look for feature names or metadata
                        if 'n_features_in_' in v.state:
                            print(f"  n_features_in_: {v.state['n_features_in_']}")
                        if 'feature_names_in_' in v.state:
                            print(f"  feature_names_in_: {v.state['feature_names_in_']}")
                        if '_is_fitted' in v.state:
                            print(f"  is_fitted: {v.state['_is_fitted']}")
                        if 'classes_' in v.state:
                            print(f"  classes: {v.state['classes_']}")
        else:
            print(f"Data type: {type(data)}")
            
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
