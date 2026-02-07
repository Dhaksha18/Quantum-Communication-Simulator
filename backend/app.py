from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import logging

app = Flask(__name__)
CORS(app)

# Logging setup (professional practice)
logging.basicConfig(level=logging.INFO)

@app.route('/')
def home():
    return "Quantum Communication Simulator Backend Running"


# Simulation logic
def simulate_qkd(qubits, distance, repeaters, eve):
    # Noise model
    error_prob = min(distance * 0.002, 0.25)

    if eve:
        error_prob += 0.05

    if repeaters > 0:
        error_prob *= (1 / (repeaters + 1))

    # Simulate errors
    errors = sum(1 for _ in range(qubits) if random.random() < error_prob)

    qber = errors / qubits
    fidelity = round(1 - qber, 3)
    key_rate = round((qubits - errors) / qubits, 3)

    return {
        "final_key_length": qubits - errors,
        "qber": round(qber, 3),
        "fidelity": fidelity,
        "key_rate": key_rate,
        "eve_detected": qber > 0.11,
        "noise_probability": round(error_prob, 3)
    }


@app.route('/simulate', methods=['POST'])
def simulate():
    try:
        data = request.json

        # Input validation
        qubits = int(data.get('qubits', 100))
        distance = int(data.get('distance', 10))
        repeaters = int(data.get('repeaters', 0))
        eve = bool(data.get('eve', False))

        if qubits <= 0:
            return jsonify({"error": "Qubits must be greater than 0"}), 400

        logging.info(f"Simulation started: qubits={qubits}, distance={distance}, repeaters={repeaters}, eve={eve}")

        result = simulate_qkd(qubits, distance, repeaters, eve)

        return jsonify(result)

    except Exception as e:
        logging.error(f"Simulation error: {str(e)}")
        return jsonify({"error": "Simulation failed"}), 500


if __name__ == "__main__":
    app.run(debug=True)
