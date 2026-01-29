from flask import Flask, request, jsonify
from flask_cors import CORS  # Required to talk to the frontend
import random

# Importing your logic files
from backend.bb84 import generate_bits, generate_bases, measure_bits, sift_key, calculate_qber
from backend.repeater import apply_repeater_noise

from metrics import calculate_fidelity
from eve import eve_intercept

app = Flask(__name__)
CORS(app)  # This enables the connection between frontend and backend

@app.route('/simulate', methods=['POST'])
def simulate():
    data = request.json
    num_qubits = int(data.get('qubits', 100))
    distance = int(data.get('distance', 10))
    eve_present = data.get('eve', False)
    repeaters = int(data.get('repeaters', 0))

    # 1. Alice prepares qubits [cite: 155, 156]
    alice_bits = generate_bits(num_qubits)
    alice_bases = generate_bases(num_qubits)

    # 2. Bob chooses his measurement bases [cite: 158]
    bob_bases = generate_bases(num_qubits)

    # 3. Transmission over the channel [cite: 160]
    transmitted_bits = alice_bits.copy()

    # 4. Eve's Intercept-Resend Attack (if enabled) [cite: 162, 163]
    if eve_present:
        transmitted_bits = eve_intercept(transmitted_bits, alice_bases)

    # 5. Bob measures the qubits [cite: 165, 170]
    bob_bits = measure_bits(transmitted_bits, alice_bases, bob_bases, eve=False)

    # 6. Apply physical channel noise/repeaters [cite: 172, 176]
    bob_bits = apply_repeater_noise(bob_bits, distance, repeaters)

    # 7. Sifting process to get the key [cite: 178, 183]
    key_comparison = sift_key(alice_bits, bob_bits, alice_bases, bob_bases)

    # 8. Calculate performance metrics [cite: 185, 186, 191]
    qber = calculate_qber(key_comparison)
    fidelity = calculate_fidelity(alice_bits, bob_bits, alice_bases, bob_bases)

    return jsonify({
        "final_key_length": len(key_comparison),
        "qber": round(qber, 3),
        "fidelity": fidelity,
        "eve_detected": qber > 0.11,  # Standard threshold for BB84 [cite: 196]
        "distance": distance,
        "repeaters": repeaters
    })

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000) # Render handles the port automatically