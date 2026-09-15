# DroneCare 🚁

**An Intelligent System for Predicting Drone Failures Using AI.**

> Graduation Project — University of Technology and Applied Sciences (UTAS), AI Division, 2026

---

## 1. Project Overview

DroneCare is an AI-powered predictive maintenance system for commercial drone fleets. It analyzes flight telemetry (battery level, wind speed, payload, GPS accuracy, altitude, etc.) and uses a trained **Artificial Neural Network (ANN)** to estimate the risk of a flight ending in failure ("Landed Unexpectedly") *before* the drone takes off. The project includes a full data-science workflow — data cleaning, exploratory analysis, model comparison, hyperparameter tuning — and an interactive **Streamlit** web application that exposes the trained model for on-demand risk predictions on planned missions, plus historical fleet analytics.

## 2. Problem Statement

Commercial and industrial drone operations (delivery, inspection, agriculture, surveillance, etc.) are exposed to operational risks such as low battery, high wind speed, GPS drift, and payload overload, which can lead to crashes or unplanned landings. These incidents:

- Damage expensive drone hardware and payloads.
- Endanger people and infrastructure when incidents occur over populated or sensitive areas.
- Are typically discovered only *after* the flight has already failed, when it is too late to intervene.

The historical telemetry log used in this project shows that of 556 recorded flights, **133 (~24%) ended in "Landed Unexpectedly"** rather than "Completed" — a meaningful failure rate that a predictive system can help reduce.

## 3. Proposed Solution

DroneCare addresses this by training a supervised machine learning model on historical flight telemetry to predict, **before a mission starts**, whether a given combination of drone, payload, and environmental conditions is likely to result in a safe completion or an unexpected landing. Several algorithms were trained and compared (Logistic Regression, Random Forest, XGBoost, SVM, and an ANN), and the **ANN was selected as the final model** based on its test-set performance. The final model, along with its data scaler and categorical encoders, is served through a Streamlit application that operators can use to:

- Simulate a planned mission and get an instant AI risk assessment.
- Explore historical fleet telemetry through interactive dashboards.
- Review the model's evaluation results and reasoning.

## 4. Main Features

The Streamlit app (`DRONE_CARE_ANN_APP.py`) is organized into five sections:

- **🏠 Home** — Landing page introducing the project and its purpose.
- **📊 Dashboard** — Interactive fleet analytics: KPIs (total missions, average battery, critical wind speed, incident probability), telemetry distribution histograms, mission status breakdown, success rate by drone model, and a feature correlation heatmap. Results can be filtered by drone model.
- **🚁 Manual Input** — A form where an operator enters the parameters of a **planned mission** (battery, wind speed, GPS accuracy, payload weight, drone model, application type, altitude, etc.) to assess it **before the flight takes place**. On submission, the inputs are encoded, scaled, and passed to the trained ANN, which returns a "Completed" or "Landed Unexpectedly" prediction with a confidence/risk score, plus a safety recommendation.
- **📈 Model Performance** — Displays the ANN's headline evaluation metrics and a short explanation of why an ANN was chosen, alongside a feature-impact chart.
- **👥 About Us** — Project mission, objectives, and team/university context.

## 5. Dataset Description

- **File:** `Supplemental Drone Telemetry Data - Drone Operations Log _test11.csv`
- **Raw size:** 556 flight records × 20 columns.
- **Target variable:** `Flight Status` — `Completed` (422 records) vs. `Landed Unexpectedly` (133 records), i.e. a moderately imbalanced binary classification problem (~76% / ~24%).
- **Preprocessing (performed in the notebook):**
  - Missing numeric values imputed with the column median; missing categorical values imputed with the column mode.
  - Duplicate rows removed.
  - Numeric outliers clipped using the IQR method.
  - Resulting cleaned dataset: **540 rows**.
  - Categorical columns label-encoded (`Application`, `Drone Model`, `Drone Size`, `Payload Type`, `Payload Description`).
  - Features scaled with `StandardScaler`.
  - Class imbalance in the training split addressed with **SMOTE** oversampling (test data left untouched).
  - Train/test split: 80% / 20%, stratified on the target (test set = 108 samples).

## 6. Input Features

Of the 20 raw columns, **13 features** were selected (based on correlation with the target) to train the model, and are the exact fields collected by the app's "Manual Input" form, in this order:

| # | Feature | Type |
|---|---------|------|
| 1 | Obstacles Encountered | Binary (Yes/No) |
| 2 | Battery Remaining (%) | Numeric |
| 3 | Wind Speed (m/s) | Numeric |
| 4 | GPS Accuracy (meters) | Numeric |
| 5 | Actual Carry Weight (kg) | Numeric |
| 6 | Max Carry Weight (kg) | Numeric |
| 7 | Propeller Count | Numeric |
| 8 | Drone Size | Categorical (Small / Medium / Large) |
| 9 | Distance Flown (km) | Numeric |
| 10 | Drone Model | Categorical (25 models) |
| 11 | Payload Type | Categorical (15 types) |
| 12 | Application | Categorical (24 mission types) |
| 13 | Altitude (meters) | Numeric |

Categorical features are encoded using the fitted `LabelEncoder`s stored in `encoders.pkl` (with a hardcoded fallback map in the app if an encoder is missing), and all 13 features are scaled with the fitted `StandardScaler` in `scaler2.pkl` before being passed to the ANN.

## 7. ANN Model Description

The final model (`ann2_model.h5`) is a feed-forward Artificial Neural Network built with Keras/TensorFlow:

```
Input (13 features)
   → Dense(64, activation="relu")
   → Dropout(0.2)
   → Dense(64, activation="relu")
   → Dropout(0.2)
   → Dense(1, activation="sigmoid")   # probability of "Landed Unexpectedly"
```

- **Optimizer:** Adam (learning rate = 0.001)
- **Loss function:** Binary cross-entropy
- **Training:** Trained on the SMOTE-balanced training set (652 samples) with early stopping on validation loss.
- **Model selection:** This architecture and its hyperparameters (hidden layer sizes, dropout rate, learning rate) were the outcome of a grid search over multiple configurations, evaluated against classical ML baselines (Logistic Regression, Random Forest, XGBoost, SVM) tuned with `GridSearchCV`. The ANN was selected as the **final model integrated into the Streamlit application** because it achieved the highest accuracy on the held-out test set.

## 8. Model Evaluation / Results

Evaluation on the 20% held-out test set (108 samples), as computed in `DRONE_CARE_CODE.ipynb`:

| Model | Accuracy | Precision | Recall | F1-Score |
|---|---|---|---|---|
| Logistic Regression | 96.30% | 89.66% | 96.30% | 92.86% |
| Random Forest | 96.30% | 89.66% | 96.30% | 92.86% |
| XGBoost | 96.30% | 87.10% | 100.00% | 93.10% |
| SVM | 94.44% | 83.87% | 96.30% | 89.66% |
| **ANN (final model)** | **98.15%** | **96.30%** | **96.30%** | **96.30%** |

**Final ANN confusion matrix** (test set, 108 samples):

|  | Predicted: Completed | Predicted: Unexpected |
|---|---|---|
| **Actual: Completed** | 80 | 1 |
| **Actual: Unexpected** | 1 | 26 |

106 out of 108 test flights were classified correctly. These figures match the headline metrics shown on the app's "Model Performance" page (Accuracy 98%, Precision 96%, F1-Score 96%).

> These results come from a single stratified train/test split on a relatively small dataset (540 cleaned records) and should be interpreted with that context — see [Future Improvements](#11-future-improvements).

## 9. Technologies Used

- **Language:** Python
- **Web application:** Streamlit
- **Deep learning:** TensorFlow / Keras
- **Machine learning & preprocessing:** scikit-learn (StandardScaler, LabelEncoder, Logistic Regression, Random Forest, SVM, GridSearchCV)
- **Gradient boosting baseline:** XGBoost
- **Class imbalance handling:** imbalanced-learn (SMOTE)
- **Model explainability (notebook):** SHAP
- **Data analysis:** pandas, NumPy
- **Visualization:** Plotly (app dashboards), Matplotlib & Seaborn (notebook EDA)
- **Statistical trendlines:** statsmodels (used internally by Plotly's OLS trendline)

## 10. Project Structure

```
drone-care-ai/
├── DRONE_CARE_ANN_APP.py    # Streamlit application (dashboard + ANN inference)
├── DRONE_CARE_CODE.ipynb    # Data cleaning, EDA, model training, tuning & evaluation
├── ann2_model.h5            # Trained ANN model (required by the app)
├── scaler2.pkl              # Fitted StandardScaler (required by the app)
├── encoders.pkl             # Fitted LabelEncoders for categorical features (required by the app)
├── Supplemental Drone Telemetry Data - Drone Operations Log _test11.csv   # Source dataset
├── requirements.txt         # Python dependencies
├── .gitignore
└── README.md
```

## 11. Installation / Setup Instructions

**Prerequisites:** Python 3.10+ recommended (to match the TensorFlow/Keras versions pinned in `requirements.txt`).

1. Clone the repository:
   ```bash
   git clone https://github.com/EnasAlshuaili/drone-care-ai.git
   cd drone-care-ai
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # macOS / Linux
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## 12. How to Run the Streamlit Application

From the project root (with the virtual environment activated and `ann2_model.h5`, `scaler2.pkl`, `encoders.pkl`, and the dataset CSV present alongside the script):

```bash
streamlit run DRONE_CARE_ANN_APP.py
```

Streamlit will start a local server and open the app in your browser (default: `http://localhost:8501`).

## 13. Future Improvements

- **Larger dataset:** Retrain on a larger, more diverse telemetry log to improve generalization beyond the current 540-record dataset and reduce the risk of overfitting on a single train/test split (e.g., k-fold cross-validation for the final reported metrics).
- **Live-computed metrics:** The "Model Performance" page currently displays fixed evaluation numbers; a future version could recompute and display metrics dynamically from a saved evaluation report each time the model is updated.
- **Model monitoring & retraining pipeline:** Track prediction drift over time and support periodic retraining as new flight data is collected.
- **In-app explainability:** Surface SHAP-based feature explanations (already used in the notebook) directly in the "Manual Input" prediction results, so operators understand *why* a flight was flagged as high-risk.
- **Deployment hardening:** Containerize the app (Docker), add automated tests, and set up a CI pipeline before deploying to a production environment.
- **Authentication & logging:** Add user authentication and prediction logging for real operational use.

---

*This README was prepared to document the final ANN-based version of the DroneCare project for public release.*
