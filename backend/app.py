from flask import Flask, request, jsonify
from flask_cors import CORS
from collision import analyze_workload

app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return "DeadlineRadar backend is running!"

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()

    tasks = data.get("tasks", [])
    availability = data.get("availability", {})

    result = analyze_workload(tasks, availability)

    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True)