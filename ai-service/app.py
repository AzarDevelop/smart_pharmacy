"""
AI / ML Micro-service (Module 4: AI & ML Module)
--------------------------------------------------
Exposes two endpoints consumed by the Node.js backend:

  POST /nlp-search      -> Intelligent Medicine Search (NLP)
  POST /predict-demand  -> Stock Demand Prediction (ML)

Run with:  python app.py   (listens on port 8000)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS

import nlp_search
import stock_prediction

app = Flask(__name__)
CORS(app)


@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "AI/ML service is running."})


@app.route("/nlp-search", methods=["POST"])
def nlp_search_endpoint():
    data = request.get_json(force=True)
    query = data.get("query", "")
    catalogue = data.get("catalogue", [])

    if not query.strip():
        return jsonify({"message": "query is required"}), 400

    matches = nlp_search.search(query, catalogue)
    return jsonify({"query": query, "matches": matches})


@app.route("/predict-demand", methods=["POST"])
def predict_demand_endpoint():
    data = request.get_json(force=True)
    history = data.get("history", [])
    days_ahead = data.get("days_ahead", 7)

    if not history:
        return jsonify({"message": "history is required"}), 400

    result = stock_prediction.predict(history, days_ahead=days_ahead)
    return jsonify(result)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
