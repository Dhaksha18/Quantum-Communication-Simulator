from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import logging
import time

app = Flask(__name__)
CORS(app)

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

APP_VERSION = "1.0.0"


@app.route('/')
def home():
    return "Quantum Communication Simulator Backend Running"


@app.route('/health')
def health():
    return jsonify({
        "status": "OK",
        "version": APP_VERSION,
        "timestamp": int(time.time())
    })


# Noise model (separate function for clarity)
def calculate_noise(distance, repeaters, eve):
    noise = min(distance * 0.002, 0.25)

    if eve:
        noise += 0.05

    if repeaters > 0:
        noise *= (1 / (repeaters + 1))

    return noise


# Single simulation run
def simulate_qkd_once(qubits, distance, repeaters, eve):

    error_prob = calculate_noise(distance, repeaters, eve)

    errors = sum(1 for _ in range(qubits) if random.random() < error_prob)

    qber = errors / qubits
    fidelity = 1 - qber
    key_rate = (qubits - errors) / qubits
    channel_loss = errors / qubits

    return qber, fidelity, key_rate, channel_loss, errors, error_prob


# Multi-run averaging
def simulate_qkd(qubits, distance, repeaters, eve, runs=5):

    qber_list = []
    fidelity_list = []
    key_rate_list = []
    loss_list = []
    errors_list = []

    for _ in range(runs):
        qber, fidelity, key_rate, loss, errors, noise_prob = simulate_qkd_once(
            qubits, distance, repeaters, eve
        )

        qber_list.append(qber)
        fidelity_list.append(fidelity)
        key_rate_list.append(key_rate)
        loss_list.append(loss)
        errors_list.append(errors)

    avg_qber = sum(qber_list) / runs
    avg_fidelity = sum(fidelity_list) / runs
    avg_key_rate = sum(key_rate_list) / runs
    avg_loss = sum(loss_list) / runs
    avg_errors = sum(errors_list) / runs

    return {
        "final_key_length": int(qubits - avg_errors),
        "qber": round(avg_qber, 4),
        "fidelity": round(avg_fidelity, 4),
        "key_rate": round(avg_key_rate, 4),
        "channel_loss": round(avg_loss, 4),
        "noise_probability": round(noise_prob, 4),
        "eve_detected": avg_qber > 0.11,
        "secure": avg_qber <= 0.11,
        "runs": runs
    }


@app.route('/simulate', methods=['POST'])
def simulate():
    try:
        data = request.get_json(force=True)

        qubits = int(data.get('qubits', 100))
        distance = int(data.get('distance', 10))
        repeaters = int(data.get('repeaters', 0))
        eve = bool(data.get('eve', False))
        runs = int(data.get('runs', 5))

        # Validation
        if qubits <= 0:
            return jsonify({"error": "Qubits must be greater than 0"}), 400

        if distance < 0:
            return jsonify({"error": "Distance must be positive"}), 400

        if repeaters < 0:
            return jsonify({"error": "Repeaters cannot be negative"}), 400

        if runs <= 0:
            return jsonify({"error": "Runs must be greater than 0"}), 400

        logging.info(
            f"Simulation request | qubits={qubits}, distance={distance}, "
            f"repeaters={repeaters}, eve={eve}, runs={runs}"
        )

        result = simulate_qkd(qubits, distance, repeaters, eve, runs)

        return jsonify(result)

    except Exception as e:
        logging.error(f"Simulation error: {str(e)}")
        return jsonify({"error": "Simulation failed"}), 500


if __name__ == "__main__":
    app.run(debug=True)
