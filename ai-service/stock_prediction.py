"""
Stock Demand Prediction (Module 4 / Feature 7: AI & ML)
---------------------------------------------------------
Given a pharmacy's historical daily/periodic sales for one medicine,
predicts expected demand for the next N days so the pharmacy can restock
ahead of time and avoid running out.

Approach: a simple, explainable linear-regression trend model over the
sales time series (day index -> quantity sold), which is a good fit for
a mini-project's scale of data while still being genuinely predictive
rather than a hardcoded guess. Falls back to a moving average if there
isn't enough variation to fit a trend.
"""

import numpy as np
from datetime import datetime, timedelta
from sklearn.linear_model import LinearRegression


def predict(history: list, days_ahead: int = 7):
    """
    history: list of {date: 'YYYY-MM-DD', quantity: int}, sorted ascending
    returns: dict with predicted_daily_avg, predicted_total, trend, forecast[]
    """
    if len(history) < 2:
        avg = history[0]["quantity"] if history else 0
        return {
            "predicted_daily_avg": avg,
            "predicted_total_next_period": avg * days_ahead,
            "trend": "insufficient_data",
            "forecast": [],
            "recommend_restock_units": max(avg * days_ahead - avg, 0)
        }

    dates = [datetime.strptime(str(h["date"]), "%Y-%m-%d") for h in history]
    base_date = dates[0]
    X = np.array([(d - base_date).days for d in dates]).reshape(-1, 1)
    y = np.array([h["quantity"] for h in history])

    model = LinearRegression()
    model.fit(X, y)

    last_day_index = X[-1][0]
    future_days = np.array([[last_day_index + i] for i in range(1, days_ahead + 1)])
    forecast_values = model.predict(future_days)
    forecast_values = np.clip(forecast_values, 0, None)  # sales can't be negative

    slope = float(model.coef_[0])
    trend = "increasing" if slope > 0.05 else ("decreasing" if slope < -0.05 else "stable")

    predicted_total = float(np.sum(forecast_values))
    predicted_daily_avg = float(np.mean(forecast_values))

    forecast_list = []
    for i, val in enumerate(forecast_values, start=1):
        forecast_date = (dates[-1] + timedelta(days=i)).strftime("%Y-%m-%d")
        forecast_list.append({"date": forecast_date, "predicted_quantity": round(float(val), 1)})

    return {
        "predicted_daily_avg": round(predicted_daily_avg, 1),
        "predicted_total_next_period": round(predicted_total, 1),
        "trend": trend,
        "forecast": forecast_list,
        "recommend_restock_units": round(predicted_total, 0)
    }
