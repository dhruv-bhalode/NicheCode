# ML-Based Skill Decay Model

This folder contains the Machine Learning implementation for predicting skill retention.

## 📂 Required Files
To run this model on another machine, you need **ALL** of the following files in the same folder:

### 1. Code Scripts
- **`skill_decay_model.py`**: The main script. Run this to see revision notifications.
- **`train_model.py`**: The training script. Run this if you want to re-train the model.

### 2. Model File
- **`skill_decay_model.joblib`**: The "brain" of the AI. This file contains the trained Random Forest model.
  - *Note: If this file is missing, `skill_decay_model.py` will automatically fall back to the old mathematical formula.*

### 3. Data Files
- **`interactions.json`**: User history (Required for training and predictions).
- **`users.json`**: List of users.
- **`display-problems.json`**: Problem details (Titles, Difficulty).

## 🚀 How to Run

### Prerequisite: Install Libraries
Open your terminal and run:
```bash
pip install pandas numpy scikit-learn joblib
```

### Option A: Run the Model (Prediction)
To see revision recommendations:
```bash
python skill_decay_model.py
```

### Option B: Retrain the Model (Learning)
If you have new data in `interactions.json` and want the AI to learn from it:
1. Run training:
   ```bash
   python train_model.py
   ```
2. This will overwrite `skill_decay_model.joblib`.
3. Run `python skill_decay_model.py` to see updated predictions.

## 🧠 Viva Explanation
- **Algorithm**: Random Forest Classifier (`scikit-learn`).
- **Input Features**:
  1. `days_since_last`: Gap duration.
  2. `difficulty`: Easy(1), Medium(2), Hard(3).
  3. `prev_time_taken`: Speed of last solution.
  4. `prev_outcome`: Did they pass/fail last time?
- **Output**: Probability of remembering the concept (Retention %).
